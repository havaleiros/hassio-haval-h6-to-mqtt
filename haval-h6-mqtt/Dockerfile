ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

WORKDIR /app

RUN apk add --no-cache nodejs

COPY . /app

RUN npm install --omit=dev

RUN chmod +x /run.sh

CMD [ "/run.sh" ]