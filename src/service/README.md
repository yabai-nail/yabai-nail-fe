# Frontend API layer

```text
service/
  api/          # Axios client, 164-operation catalog, executor, SWR fetcher
  admin/        # Typed queries/hooks for the current admin UI
  branches/     # One feature: types, imperative service, reactive SWR hooks
```

Create future domains beside `branches` with the same files:

- `types.ts`: request and response contracts from the backend.
- `service.ts`: imperative queries and mutations through `apiRequest`.
- `hooks.ts`: client-side SWR queries; mutations call the service then `mutate`.
- `index.ts`: the public exports for that domain.

The Axios base URL comes from `NEXT_PUBLIC_API_URL`. The default local value is
`http://localhost:4000/api/v1`. Successful backend envelopes are unwrapped before
they reach components, while backend error envelopes become `ApiClientError`.

Access tokens are kept in memory and are only attached to relative backend URLs.
For session persistence across reloads, prefer a backend-issued `httpOnly` cookie;
do not move bearer tokens to `localStorage`.

`apiOperations` mirrors all 164 canonical operations from the backend registry.
`runtimeApiOperations` also includes 19 concrete compatibility routes discovered
from runtime Swagger (183 unique method/path pairs total). The 174 app-facing
routes can be called through `executeApiOperation` and queried through
`useApiOperation`. Nine provider webhook/internal job routes remain in the
inventory for coverage but are deliberately rejected by the browser client.
