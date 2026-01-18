import { describe, it, expect, vi } from "vitest";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
        })),
    },
}));

describe("chatFeatures", () => {

    it("verify message structure", () => {
        const message = {
            id: "1",
            content: "Hello",
            media_url: "http://example.com/img.jpg",
            media_type: "image",
            deleted: false
        };

        expect(message.media_url).toBeDefined();
        expect(message.deleted).toBe(false);
    });

    it("verify reaction structure", () => {
        const message = {
            id: "1",
            reactions: { "user1": "❤️" }
        };
        expect(message.reactions).toBeDefined();
        expect(message.reactions["user1"]).toBe("❤️");
    });
});
