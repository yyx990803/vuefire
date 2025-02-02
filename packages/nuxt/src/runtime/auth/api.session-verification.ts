import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import {
  readBody,
  setCookie,
  assertMethod,
  defineEventHandler,
  deleteCookie,
  setResponseStatus,
} from 'h3'
import { ensureAdminApp } from 'vuefire/server'
import { logger } from '../logging'
import { useRuntimeConfig } from '#imports'

/**
 * Setups an API endpoint to be used by the client to mint a cookie based auth session.
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, 'POST')
  const { token } = await readBody<{ token?: string }>(event)
  const runtimeConfig = useRuntimeConfig()

  const adminApp = ensureAdminApp(
    {
      // NOTE: ensured by the module
      projectId: runtimeConfig.public.vuefire!.config!.projectId,
      ...runtimeConfig.vuefire?.admin?.options,
    },
    'session-verification'
  )
  const adminAuth = getAdminAuth(adminApp)

  logger.debug(token ? 'Verifying the token' : 'Deleting the session cookie')
  try {
    const verifiedIdToken = token ? await adminAuth.verifyIdToken(token) : null

    if (verifiedIdToken) {
      if (
        new Date().getTime() / 1_000 - verifiedIdToken.iat >
        ID_TOKEN_MAX_AGE
      ) {
        setResponseStatus(event, 301)
      } else {
        const cookie = await adminAuth
          .createSessionCookie(token!, { expiresIn: AUTH_COOKIE_MAX_AGE })
          .catch((e: any) => {
            logger.error('Error minting the cookie', e)
          })
        if (cookie) {
          // logger.debug(`minted a session cookie for user ${verifiedIdToken.uid}`)
          setCookie(event, AUTH_COOKIE_NAME, cookie, {
            maxAge: AUTH_COOKIE_MAX_AGE,
            secure: true,
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            // add user overrides
            ...(typeof runtimeConfig.vuefire?.auth?.sessionCookie === 'object'
              ? runtimeConfig.vuefire?.auth?.sessionCookie
              : {}),
          })
          setResponseStatus(event, 201)
          return ''
        } else {
          setResponseStatus(event, 401)
          return ''
        }
      }
    } else {
      throw new Error('Cannot verify the token')
    }
  } catch (error: any) {
    logger.debug(`[${error.code}] ${error.message}`)
    deleteCookie(event, AUTH_COOKIE_NAME)
    setResponseStatus(event, 204)
  }

  // empty response
  return ''
})

// these must be within this file because the handler gets inlined in dev mode
const ID_TOKEN_MAX_AGE = 5 * 60
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 5 * 1_000
// MUST be named session to be kept
// https://firebase.google.com/docs/hosting/manage-cache#using_cookies
const AUTH_COOKIE_NAME = '__session'
