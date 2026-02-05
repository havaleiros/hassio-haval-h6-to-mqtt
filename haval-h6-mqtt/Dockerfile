ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG=C.UTF-8

WORKDIR /app

RUN apk add --no-cache nodejs npm

COPY . /app

RUN npm install --omit=dev

RUN chmod +x run.sh

CMD [ "/app/run.sh" ]