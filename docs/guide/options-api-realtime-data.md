# Options API Realtime Data

::: tip
This pages assumes you have read the [Realtime Data](./realtime-data.md) page and only covers the syntax differences between the Options API and the Composition API.
:::

There are two ways of using Realtime Data with VueFire:

- Declarative binding with the `firebase`/`firestore` option
- Programmatic binding with the injected methods `$databaseBind`/`$firestoreBind`

Once you _bind_, VueFire will keep the local version synchronized with the remote Database. However, this synchronization **is only one-way**. Do not modify the local variable (e.g. doing `this.user.name = 'John'`), because (a) it will not change the remote Database and (b) it can be overwritten at any time by VueFire. To [write changes to the Database](./writing-data.md), use the Firebase JS SDK. In other words, **treat the local variable as read-only**.

## Setup

In order to use the `firebase`/`firestore` option and other functions described in this page, you need to add the modules the `vuefire` plugin:

```ts
import { VueFireFirestoreOptionsAPI, VueFireDatabaseOptionsAPI } from 'vuefire'

app.use(VueFire, {
  modules: [
    // to use the `firestore` option
    VueFireFirestoreOptionsAPI(),
    // to use the `firebase` option
    VueFireDatabaseOptionsAPI(),
  ]
})
```

You can pass global options to the modules but note **these options only affect the Options API usage**. They do not affect composition API calls such as `useDocument()` and `useDatabaseObject()`. [Check the global options](./global-options.md) to see how you can override those.

```ts
app.use(VueFire, {
  modules: [
    VueFireFirestoreOptionsAPI({
      // this would be the same behavior as VueFire v2
      reset: true,
      wait: false,
    }),
    VueFireDatabaseOptionsAPI({
      // this would be the same behavior as VueFire v2
      reset: true,
      wait: false,
    }),
  ]
})
```

## Declarative binding

Any Database Reference provided in a `firebase`/`firestore` option will be bound at creation (after Vue's `beforeMount` hook) to the specified key on the component. In the following example we bind a _collection_ of Documents to our `documents` property. The key provided in the `firebase`/`firestore` option (`documents`) must be initialized in the `data` of the component:

<FirebaseExample>

```js
// RecentDocuments.vue
import { ref as dbRef } from 'firebase/database'

export default {
  data() {
    return {
      // must be an empty array to be bound as a list
      documents: [],
    }
  },

  firebase: {
    documents: dbRef(db, 'documents'),
  },
}
```

```js
// RecentDocuments.vue
import { collection } from 'firebase/firestore'

export default {
  data() {
    return {
      documents: [],
    }
  },

  firestore: {
    documents: collection(db, 'documents'),
  },
}
```

</FirebaseExample>

::: warning
You must declare properties with their initial values in `data`. **For Firebase Database, using an _Array_ as the initial value will bind the Reference as an array, otherwise it will be bound as an object**. For Firestore, collections and queries are bound as arrays while documents are bound as objects.
:::

## Programmatic binding

If you need to change the bound reference while the application is running, e.g. to display a different user profile, or different product detail page, _Declarative binding_ isn't enough. This can be achieved through the `$databaseBind`/`$firestoreBind` methods:

<FirebaseExample>

```js
// UserProfile.vue
const users = dbRef(db, 'users')

export default {
  props: ['id'],
  data() {
    return {
      user: null,
    }
  },

  watch: {
    id: {
      // call it upon creation too
      immediate: true,
      handler(id) {
        this.$databaseBind('user', dbRef(users, id))
      },
    },
  },
}
```

```js
// UserProfile.vue
const users = collection(db, 'users')

export default {
  props: ['id'],
  data() {
    return {
      user: null,
    }
  },

  watch: {
    id: {
      // call it upon creation too
      immediate: true,
      handler(id) {
        this.$firestoreBind('user', doc(users, id))
      },
    },
  },
}
```

</FirebaseExample>

With the approach above, `user` will always be bound to the user defined by the prop `id`

::: tip
No need to call `$databaseUnbind`/`$firestoreUnbind` as `$databaseBind`/`$firestoreBind` will automatically unbind any existing binding on the provided key. Upon component removal, all bindings are removed as well, so no need to use `$databaseUnbind`/`$firestoreUnbind` in `unmounted` hooks.
:::

If you need to wait for a binding to be ready before doing something, you can _await_ the returned Promise:

<FirebaseExample>

```js
this.$databaseBind('user', dbRef(users, this.id).then(user => {
  // user will be an object if this.user was set to anything but an array
  // and it will point to the same property declared in data:
  // this.user === user
})

this.$databaseBind('documents', query(documents, orderByChild('creator'), equalTo(this.id))).then(documents => {
  // documents will be an array if this.documents was initially set to an array
  // and it will point to the same property declared in data:
  // this.documents === documents
})
```

```js
this.$firestoreBind('user', doc(users, this.id)).then(user => {
  // user will point to the same property declared in data:
  // this.user === user
})

this.$firestoreBind('documents', query(documents, where('creator', '==', this.id))).then(documents => {
  // documents will point to the same property declared in data:
  // this.documents === documents
})
```

</FirebaseExample>

## Unbinding / Unsubscribing to changes

While VueFire will automatically unbind any reference bound in a component whenever needed, you may still want to do it on your own to stop displaying updates on a document or collection or because the user logged out and they do not have the permissions anymore.

<FirebaseExample>

```js
// unsubscribe from Database updates
this.$databaseUnbind('user')
this.$databaseUnbind('documents')
```

```js
// unsubscribe from Database updates
this.$firestoreUnbind('user')
this.$firestoreUnbind('documents')
```

</FirebaseExample>

By default, VueFire **does not reset** a bound property but you can customize this behavior by providing a second argument to the `firestoreUnbind`/`rtdbUnbind`

<FirebaseExample>

```js
// default behavior: leave the property unchanged after unbinding
this.$databaseUnbind('user')
// same as
this.$databaseUnbind('user', false)
// Afterwards this.user will retain its value, e.g. { name: 'Eduardo' }

// if you set the second parameter to `true`, the property will be reset to a standard value
// for references bound as primitives or objects, this standard value is `null`
this.$databaseUnbind('user', true)
// Afterwards, this.user === null.

// for references bound as arrays, this standard value is an empty array
this.$databaseUnbind('documents', true)
// this.documents === []

// you can specify what value to reset the property to, using a function instead of `true`
this.$databaseUnbind('user', () => ({ name: 'unregistered' }))
// this.user === { name: 'unregistered' }

```

```js
// default behavior is to keep current value
this.$firestoreUnbind('user')
this.$firestoreUnbind('user', false)
// this.user === { name: 'Eduardo' }

// if you send Boolean true in the reset parameter, the value will change to null
this.$firestoreUnbind('user', true)
// this.user === null

// using the function syntax to customize the value
this.$firestoreUnbind('user', () => ({ name: 'unregistered' })
// this.user === { name: 'unregistered' }

// for collections, they are reset to an empty array by default instead of `null`
this.$firestoreUnbind('documents', true)
// this.documents === []
```

</FirebaseExample>

It's also possible to customize this behavior at the time of _binding_ by using the `reset` option:

<FirebaseExample>

```js
// using a boolean value for reset
await this.$databaseBind('user', userRef)
this.$databaseBind('user', otherUserRef, { reset: true })
// before the user has been fetched for the first time, you will have
// this.user === null
```

```js
// using a boolean value for reset
await this.$firestoreBind('user', userRef)
this.$firestoreBind('user', otherUserRef, { reset: true })
// before the user has been fetched for the first time, you will have
// this.user === null
```

</FirebaseExample>

You can change this behavior globally as well when adding the Options API module:

<FirebaseExample>

```ts
VueFireDatabaseOptionsAPI({
  reset: true,
})
```

```ts
VueFireFirestoreOptionsAPI({
  reset: true,
})
```

</FirebaseExample>
