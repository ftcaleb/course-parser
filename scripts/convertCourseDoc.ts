import mammoth from "mammoth";
import slugify from "slugify";

export async function convertCourseDoc(filePath: string) {
    const result = await mammoth.extractRawText({ path: filePath });

    const text = result.value;

    const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const titleLine = lines[0];

    const title = titleLine.replace(/\(.*\)/, "").trim();
    const durationMatch = titleLine.match(/\((.*?)\)/);

    const duration = durationMatch ? durationMatch[1] : "";

    const slug = slugify(title, { lower: true });

    const course = {
        id: 0,
        type: "Supply-Chain-Procurement",
        title,
        duration,
        slg: slug,
        popular: false,
        seo: {
            seoTitle: `${title} Course | SkillHub International`,
            seoDescription: `${title} training course offered by SkillHub International.`,
            seoKeywords: `${slug}, training course, skillhub`,
            seoHeading: title,
        },
        brochure: "",
        shortDesc: "",
        overview: "",
        audience: [] as string[],
        objectives: {
            title: "Upon completion of this training, participants will be able to:",
            data: [] as string[],
        },
        content: [] as any[],
    };

    let mode: string | null = null;

    lines.forEach((line) => {
        const lower = line.toLowerCase();

        if (lower.includes("course overview")) {
            mode = "overview";
            return;
        }

        if (lower.includes("target audience")) {
            mode = "audience";
            return;
        }

        if (lower.includes("training objectives")) {
            mode = "objectives";
            return;
        }

        if (lower.includes("course outline")) {
            mode = "outline";
            return;
        }

        if (mode === "overview") {
            course.overview += line + " ";
        }

        if (mode === "audience") {
            course.audience.push(line);
        }

        if (mode === "objectives") {
            course.objectives.data.push(line);
        }

        if (line.startsWith("Module")) {
            const moduleNumber = line.match(/\d+/)?.[0];

            course.content.push({
                module: Number(moduleNumber),
                lessons: [],
            });

            mode = "lessons";
            return;
        }

        if (mode === "lessons") {
            const lastModule = course.content[course.content.length - 1];

            if (lastModule) {
                lastModule.lessons.push(line);
            }
        }
    });

    return course;
}