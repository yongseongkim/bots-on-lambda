// import { handler } from "./apt.js";
// import { handler } from "./polygon.js";
import { handler } from "./visualize.js";
// import { handler } from "./jsonify.js";

(async () => {
  const result = await handler();
  console.log(result);
})();
