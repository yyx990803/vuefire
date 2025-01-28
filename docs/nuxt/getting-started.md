# Nuxt.js

VueFire comes with an official Nuxt module that automatically handles most of the hassle of setting up VueFire in your Nuxt project.

## Installation
```bash
npm install firebase
npx nuxi@latest module add vuefire
```
(You might need to run the second command after initializing the vuefire module configuration in your `nuxt.config.js`)


Additionally, if you are using [SSR](https://nuxt.com/docs/api/configuration/nuxt-config/#ssr), you need to install `firebase-admin` and its peer dependencies:

::: code-group

```sh [pnpm]
pnpm install firebase-admin firebase-functions @firebase/app-types
```

```sh [yarn]
yarn add firebase-admin firebase-functions @firebase/app-types
```

```sh [npm]
npm install firebase-admin firebase-functions @firebase/app-types
```

:::

::: tip

Depending on your needs, you might want to set up SSR or not. The final complexity of the project is really different. If you want a starter project see the existing templates:

- [Spark Plan](https://github.com/posva/nuxt--vuefire-example-spark-plan)
- [Blaze Plan](https://github.com/posva/nuxt--vuefire-example-blaze-plan)

:::

## Configuration

Next, add `nuxt-vuefire` to the `modules` section of `nuxt.config.js` and configure it with the credentials created in your app settings in your project overview (`https://console.firebase.google.com/project/YOUR_PROJECT_NAME/overview)`. You can find more details [in Firebase Documentation](https://firebase.google.com/docs/web/setup#create-project). It should look something like this:

```ts{4,7-15}
export default defineNuxtConfig({
  modules: [
    // ... other modules
    'nuxt-vuefire',
  ],

  vuefire: {
    config: {
      apiKey: '...',
      authDomain: '...',
      projectId: '...',
      appId: '...',
      // there could be other properties depending on the project
    },
  },
})
```

### Configuring the Admin SDK

If you are using SSR with any auth related feature, you will need to create a [service account](https://firebase.google.com/support/guides/service-accounts) and provide its content as an _environment variable_ named `GOOGLE_APPLICATION_CREDENTIALS` in the `.env` file.

In local development it's more convenient to put the `service-account.json` file alongside other files and refer to its path in the environment variable:

```txt
GOOGLE_APPLICATION_CREDENTIALS=service-account.json
```

:::tip
This service account file contains sensitive information and should **not be committed to your repository**. Make sure to exclude it from your version control system:

```sh
echo service-account.json >> .gitignore
```

:::

### Additional configuration

If you are using the [Authentication](https://firebase.google.com/docs/auth) module or [AppCheck](https://firebase.google.com/docs/app-check#web), make sure to enable them as well:

```ts{5-7,8-13}
export default defineNuxtConfig({
  // ...
  vuefire: {
    // ensures the auth module is enabled
    auth: {
      enabled: true
    },
    appCheck: {
      // Allows you to use a debug token in development
      debug: process.env.NODE_ENV !== 'production',
      isTokenAutoRefreshEnabled: true,
      provider: 'ReCaptchaV3',
      // Find the instructions in the Firebase documentation, link above
      key: '...',
    },
  },
})
```

## Auto imports

Nuxt VueFire will automatically import the most commonly used functions of `vuefire` so you don't even need to import them in your components ✨.
