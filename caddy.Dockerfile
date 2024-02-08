ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

# Use the official Golang image to create a build artifact.
# This is based on Debian and sets the GOPATH environment variable at /go.
FROM golang:1.20.8-alpine3.18 AS builder

# Install git.
# Git is required for fetching the dependencies.
RUN apk add --no-cache git

# Install xcaddy
RUN go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest

# Build Caddy with the specified plugin
RUN xcaddy build \
  --with github.com/protomaps/go-pmtiles/caddy

#

# Use the caddy image to execute the compiled binary
FROM caddy:2-alpine

ENV AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
ENV AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

# Copy the Caddy binary from the builder stage
COPY --from=builder /go/caddy /usr/bin/caddy
