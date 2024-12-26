# FROM --platform=$BUILDPLATFORM node:20.13.1 AS build

# WORKDIR /vink-ui
# COPY . .
# RUN rm -rf node_modules package-lock.json
# RUN npm install && npm run build

# FROM --platform=$BUILDPLATFORM nginx:stable-perl
# RUN rm -rf /usr/share/nginx/html/*
# COPY --from=build /vink-ui/dist/ /usr/share/nginx/html
# EXPOSE 80
# ENTRYPOINT ["nginx", "-g", "daemon off;"]

FROM --platform=$BUILDPLATFORM nginx:stable-perl
RUN rm -rf /usr/share/nginx/html/*
COPY dist/ /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
