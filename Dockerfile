ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG STORAGE_BUCKET_NAME
ARG STORAGE_REGION
ARG STORAGE_ENDPOINT

FROM node:20-bookworm-slim as base
RUN apt-get update && apt-get install -y \
  sqlite3 \
  curl \
  git \
  make \
  g++ \
  libsqlite3-dev \
  zlib1g-dev
RUN rm -rf /var/lib/apt/lists/*
RUN corepack enable

# Install cli deps
RUN mkdir -p /app/vendor
WORKDIR /app/vendor
RUN git clone https://github.com/felt/tippecanoe.git
WORKDIR /app/vendor/tippecanoe
RUN make \
  && make install
RUN cp tippecanoe /usr/local/bin/

# pmtimes
# https://github.com/protomaps/go-pmtiles/releases/download/v1.14.0/go-pmtiles_1.14.0_Linux_arm64.tar.gz
RUN rm -rf pmtiles
RUN curl -L https://github.com/protomaps/go-pmtiles/releases/download/v1.14.0/go-pmtiles_1.14.0_Linux_arm64.tar.gz -o go-pmtiles.tar.gz
RUN tar -xzf go-pmtiles.tar.gz
RUN mv pmtiles /usr/local/bin/
RUN rm -f go-pmtiles.tar.gz

# switch back to app
WORKDIR /app

# Copy only necessary files and directories
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc tsconfig.json .eslintrc.js ./
COPY apps/web ./apps/web
COPY packages ./packages

# Build the application
# Note: Adjust the build command according to your project's needs
RUN pnpm install --frozen-lockfile
RUN pnpm run build --filter=@repo/web...

# Final stage
FROM node:20-bookworm-slim AS runner
RUN corepack enable
WORKDIR /app
COPY --from=base /app .

# Set environment variables
ENV NODE_ENV production
ENV TIPPECANOE_PATH=/usr/local/bin/tippecanoe
ENV PMTILE_PATH=/usr/local/bin/pmtiles

ENV AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
ENV AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
ENV STORAGE_BUCKET_NAME=${STORAGE_BUCKET_NAME}
ENV STORAGE_REGION=${STORAGE_REGION}
ENV STORAGE_ENDPOINT=${STORAGE_ENDPOINT}

# Expose the port your app runs on
EXPOSE 3000

# Command to run your app
CMD ["pnpm", "run", "start:web"]
