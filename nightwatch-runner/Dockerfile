FROM cgr.dev/chainguard-private/jdk-fips:latest-dev

USER root

RUN apk update && apk add --no-cache \
    nodejs \
    npm \
    bash \
    ca-certificates \
    netcat-openbsd \
  && rm -rf /var/cache/apk/*

WORKDIR /workspace

COPY package.json package-lock.json* ./
RUN npm install --production=false

COPY nightwatch.conf.js ./nightwatch.conf.js
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY tests ./tests

ENV CI=1
ENV JAVA_HOME=/usr/lib/jvm/default-jvm
ENV PATH="${JAVA_HOME}/bin:${PATH}"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]