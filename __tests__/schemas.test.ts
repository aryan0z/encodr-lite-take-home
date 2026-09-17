import {describe, expect, it} from 'vitest';
import {sourceUrlSchema} from "@/lib/schemas";
describe("sourceUrlSchema", () => {
    it("accepts a valid HTTP URL", () => {
        const result = sourceUrlSchema.safeParse(
            "http://media.example.com/a/b/movie.mov"
        );
        expect(result.success).toBe(true);
    });
    it("accepts a valid HTTPS URL", () => {
        const result = sourceUrlSchema.safeParse(
            "https://cdn.example.com/videos/clip.mp4"
        );
        expect(result.success).toBe(true);
    });
    it("rejects an invalid URL", () => {
        const result = sourceUrlSchema.safeParse(
            "not a URL"
        );
        expect(result.success).toBe(false);
        if(!result.success){
            expect(result.error.issues[0].message).toBe("not a URL at all");
        }
    });
    it("rejects  URL with worng protocol", () => {
        const result = sourceUrlSchema.safeParse(
            "ftp://cdn.example.com/clip.mp4"
        );
        expect(result.success).toBe(false);
        if(!result.success){
            expect(result.error.issues[0].message).toBe(
                "wrong protocol; only http and https"
            );
        }
    });
    it("rejects a URL without a file path", () => {
        const result = sourceUrlSchema.safeParse(
            "https://cdn.example.com"
        );
        expect(result.success).toBe(false);
        if(!result.success){
            expect(result.error.issues[0].message).toBe(
                "no file path, so there's nothing to encode"
            );
        }
    });
});
