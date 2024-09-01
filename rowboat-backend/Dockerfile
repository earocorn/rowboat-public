FROM golang:1.22-alpine
RUN apk add --no-cache --update gcc g++
WORKDIR /app
COPY . .
RUN go mod download
ENV CGO_ENABLED=1
RUN go build rowboat-backend
ENTRYPOINT [ "./rowboat-backend" ]