ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apk add --no-cache \
    nodejs \
    npm

COPY . /
RUN cd / && npm install --unsafe-perm

RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
