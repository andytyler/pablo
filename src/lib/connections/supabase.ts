import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImage(image: File, folder: string = 'designs') {
	const { data, error } = await supabase.storage.from(folder).upload(image.name, image);
	return { data, error };
}

export async function getImageUrl(imageName: string, folder: string = 'designs') {
	const { data, error } = await supabase.storage
		.from(folder)
		.createSignedUrl(imageName, 60 * 60 * 24 * 30);
	if (error) {
		console.error('📸 [screenshot] Error getting image URL:', error);
		return { url: null, error };
	}
	return { url: data.signedUrl, error };
}
