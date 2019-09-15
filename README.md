# Endpoint Imposter

Just create a file containing your mocks,
```javascript
// mocks.js
module.exports = [
  {
    request: { path: '/todos' },
    response: { json: ['a', 'b', 'c'] },
  }
]
```
tell Endpoint Imposter where to find this file,
```
$ npx endpoint-imposter --port 3000 --mocks mocks.js
```
and enjoy your mocked server! 
```
$ curl http://localhost:3000/sessionId/todos     
["a","b","c"]%
```

For a detailed description and more examples, please check out [📖 the documentation](https://endpoint-imposter.js.org/doc.html).