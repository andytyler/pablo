import { REPLICATE_API_TOKEN } from '$env/static/private';
import Replicate from 'replicate';
const replicate = new Replicate({
	auth: REPLICATE_API_TOKEN,
	useFileOutput: false // Prevent getting ReadableStream response
});

export async function removeBackground(image: string) {
	try {
		const output: any = await replicate.run(
			'smoretalk/rembg-enhance:4067ee2a58f6c161d434a9c077cfa012820b8e076efa2772aa171e26557da919',
			{
				input: {
					image: image
				}
			}
		);

		console.log('🎨 [removeBackground] output', output);

		// const { data, error: uploadError } = await uploadImage(output);

		return { url: output, error: null };
	} catch (error) {
		console.error('🎨 [removeBackground] Error:', error);
		return { url: null, error: error };
	}
}
