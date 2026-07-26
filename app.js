import { app } from 'nitron'

app.init({
  name: "Sway POS",
  packageId: "com.sway.pos",
  version: "1.1.0",
  entry: "index.html",
  orientation: "portrait",
  statusBar: true,
  icon: "icons/icon-512.png",
  permissions: ["INTERNET"]
})
