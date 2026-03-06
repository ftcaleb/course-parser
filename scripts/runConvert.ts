import { convertCourseDoc } from "./convertCourseDoc";

async function run() {
    const course = await convertCourseDoc(
        "./docs/SHI Bar  Beverage Service  Mixology.docx"
    );

    console.log(JSON.stringify(course, null, 2));
}

run();
// npx tsx scripts/runConvert.ts 