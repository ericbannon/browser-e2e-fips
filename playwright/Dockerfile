FROM cgr.dev/chainguard-private/node-fips:latest-dev

USER root

# System deps Playwright needs to run Chromium headless on Alpine
# (This is similar in spirit to your Cypress deps; Playwright needs a bunch of libs too.)
RUN apk update && apk add --no-cache \
  bash \
  ca-certificates \
  chromium \
  nss \
  freetype \
  harfbuzz \
  fontconfig \
  ttf-dejavu \
  mesa-gl \
  mesa-gbm \
  libdrm \
  gtk-3 \
  at-spi2-core \
  dbus-libs \
  alsa-lib \
  libx11 \
  libxcomposite \
  libxdamage \
  libxext \
  libxfixes \
  libxrandr \
  libxrender \
  libxtst \
  libxi \
  libxcb \
  libxkbcommon \
  libxkbfile \
  eudev-libs

WORKDIR /e2e

# Install JS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Copy tests + config
COPY playwright.config.js /e2e/playwright.config.js
COPY tests/ /e2e/tests/

# Drop privileges (Chainguard images usually run nonroot already, but being explicit is ok)
RUN addgroup -S nonroot \
 && adduser -S nonroot -G nonroot -h /home/nonroot \
 && chown -R nonroot:nonroot /e2e /home/nonroot

USER nonroot
ENV CI=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

CMD ["npm", "test"]

