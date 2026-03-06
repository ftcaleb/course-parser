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
    let duration = durationMatch ? durationMatch[1] : "";

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

    const sectionKeywords = {
        overview: ["course overview", "program summary", "programme summary", "about the course"],
        audience: ["target audience", "who should attend", "intended for"],
        objectives: ["training objectives", "learning outcomes", "what you will learn"],
        outline: ["course outline", "course curriculum", "program content", "course content"],
        duration: ["duration of course", "course duration", "duration"],
    };

    function robustSplit(content: string) {
        // Split by bullet points or where a lowercase letter is followed by an uppercase letter (mammoth join)
        // We also split by common prefix patterns if they appear mid-text
        return content
            .split(/(?=[•\-\d\.]\s)|(?<=[a-z])(?=[A-Z])/)
            .map(p => p.trim())
            .filter(Boolean);
    }

    function processContent(currentMode: string, content: string) {
        if (currentMode === "overview") {
            course.overview += content + " ";
        } else if (currentMode === "audience") {
            const cleaned = content.replace(/^Ideal for:\s*/i, "");
            course.audience.push(...robustSplit(cleaned));
        } else if (currentMode === "objectives") {
            const cleaned = content.replace(/^By the end of the programme, participants will be able to:\s*/i, "");
            course.objectives.data.push(...robustSplit(cleaned));
        } else if (currentMode === "lessons") {
            const lastModule = course.content[course.content.length - 1];
            if (lastModule) {
                lastModule.lessons.push(...robustSplit(content));
            }
        } else if (currentMode === "duration" && !course.duration) {
            course.duration = content;
        }
    }

    lines.forEach((line) => {
        const lower = line.toLowerCase();

        // Check for section headers
        for (const [key, keywords] of Object.entries(sectionKeywords)) {
            for (const keyword of keywords) {
                if (lower.startsWith(keyword)) {
                    mode = key;
                    const contentPart = line.substring(keyword.length).trim().replace(/^[:\-\s]+/, "");
                    if (contentPart) {
                        processContent(key, contentPart);
                    }
                    return;
                }
            }
        }

        if (line.startsWith("Module")) {
            const moduleMatch = line.match(/Module\s*(\d+)\s*[:\-\s]*(.*)/i);
            if (moduleMatch) {
                const moduleNumber = moduleMatch[1];
                const rawModuleContent = moduleMatch[2];

                let moduleTitle = rawModuleContent;
                let firstLessons: string[] = [];

                // Split where a lowercase letter is followed by an uppercase letter
                const splitIndex = rawModuleContent.search(/[a-z][A-Z]/);
                if (splitIndex !== -1) {
                    moduleTitle = rawModuleContent.substring(0, splitIndex + 1);
                    const remaining = rawModuleContent.substring(splitIndex + 1);
                    firstLessons = robustSplit(remaining);
                }

                course.content.push({
                    module: Number(moduleNumber),
                    lessons: [moduleTitle.trim(), ...firstLessons].filter(Boolean),
                });

                mode = "lessons";
                return;
            }
        }

        if (mode) {
            processContent(mode, line);
        }
    });

    // Final cleanup
    course.overview = course.overview.trim();
    course.objectives.data = [course.objectives.title, ...course.objectives.data];

    return course;
}