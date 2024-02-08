# OS Tiler

An open source tile server and manager leveraging PMTiles.

## Inspiration

Todo

## Getting Started

Todo

## Worker
```bash
npx wrangler generate ostiler-server
```

## R2 Bucket
```bash
npx wrangler r2 bucket create tiles
```

### Bucket CORS Policy
```json
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "PUT",
      "POST"
    ],
    "AllowedHeaders": [
      "range",
      "if-match"
    ],
    "ExposeHeaders": [
      "etag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```
