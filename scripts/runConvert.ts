import { convertCourseDoc } from "./convertCourseDoc";

async function run() {
    const course = await convertCourseDoc(
        "./docs/Public Procurement Policy Framework Act (PPPFA).docx"
    );

    console.log(JSON.stringify(course, null, 2));
}

run();
// npx tsx scripts/runConvert.ts 