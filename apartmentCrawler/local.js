import { handler } from "./apt.js";
// import { handler } from "./polygon.js";
// import { handler } from "./flat_polygon.js";

(async () => {
  const result = await handler();
  console.log(result);
})();
