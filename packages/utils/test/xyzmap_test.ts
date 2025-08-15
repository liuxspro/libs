import { XYZMap } from "../src/index.ts";

const demo = new XYZMap("demo", "https://demo.demo/&z={z}/{x}/{y}");

demo.as_wmts("demo", "a demo");
