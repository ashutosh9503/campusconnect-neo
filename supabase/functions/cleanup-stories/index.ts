// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Define a type for our story record
interface Story {
    id: string;
    user_id: string;
    media_url: string;
    expires_at: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Supabase client with Service Role Key for admin privileges (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req: Request) => {
    try {
        console.log('Starting cleanup-stories function...')

        // 1. Fetch expired stories
        // We select those that have expired AND haven't been deleted yet (implied by existence)
        const { data: expiredStories, error: fetchError } = await supabase
            .from('stories')
            .select('id, user_id, media_url')
            .lt('expires_at', new Date().toISOString())

        if (fetchError) {
            throw new Error(`Error fetching expired stories: ${fetchError.message}`)
        }

        if (!expiredStories || expiredStories.length === 0) {
            console.log('No expired stories found.')
            return new Response(JSON.stringify({ message: 'No expired stories to clean up' }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }

        console.log(`Found ${expiredStories.length} expired stories. Processing cleanup...`)

        // 2. Delete from Storage
        const filesToDelete: string[] = []

        for (const story of expiredStories as Story[]) {
            if (story.media_url) {
                try {
                    const url = new URL(story.media_url);
                    const bucketName = 'stories'
                    const token = `/public/${bucketName}/`
                    if (story.media_url.includes(token)) {
                        const path = story.media_url.split(token)[1]
                        if (path) {
                            filesToDelete.push(decodeURIComponent(path))
                        }
                    }
                } catch (e) {
                    console.error('Error parsing URL for story', story.id, e)
                }
            }
        }

        if (filesToDelete.length > 0) {
            console.log(`Deleting ${filesToDelete.length} files from storage...`)
            const { error: storageError } = await supabase.storage
                .from('stories')
                .remove(filesToDelete)

            if (storageError) {
                console.error('Error deleting files from storage:', storageError)
            } else {
                console.log('Storage files deleted successfully.')
            }
        }

        // 3. Delete Rows from Database
        const storyIds = expiredStories.map((s: any) => s.id)
        const { error: deleteError } = await supabase
            .from('stories')
            .delete()
            .in('id', storyIds)

        if (deleteError) {
            throw new Error(`Error deleting story rows: ${deleteError.message}`)
        }

        console.log(`Successfully deleted ${storyIds.length} expired stories from DB.`)

        return new Response(
            JSON.stringify({
                message: `Cleanup complete. Deleted ${storyIds.length} stories and ${filesToDelete.length} files.`,
                deleted_count: storyIds.length
            }),
            { headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Cleanup failed:', error)
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
