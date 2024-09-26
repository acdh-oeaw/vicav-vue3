import lightGallery from "lightgallery";

export function useImageGalleryProcessor(element: Ref<HTMLDivElement>) {
	/**
	 * Intercept anchor clicks to open window instead of navigating.
	 */
	function processImageGalleries() {
		[...element.value.querySelectorAll("gallery")].forEach((galleryElement) => {
			const data = [...(galleryElement.children as unknown as Array<HTMLAnchorElement>)].map(
				(galleryImage: HTMLAnchorElement, index) => {
					return {
						src: galleryImage.href,
						thumb: galleryImage.querySelector("img")?.src.toString(),
						subHtml: `<div class="text-white">
										<p>${galleryImage.querySelector("img")!.alt.toString()}</p>
										<p>${(index + 1).toString()} / ${galleryElement.children.length.toString()}</p>
								</div>`,
					};
				},
			);
			console.log(data, galleryElement);
			galleryElement.replaceChildren("");
			const gallery = lightGallery(galleryElement as HTMLElement, {
				container: galleryElement as HTMLElement,
				height: "300px",
				licenseKey: "0000-0000-000-0000",
				dynamic: true,
				// Turn off hash plugin in case if you are using it
				// as we don't want to change the url on slide change
				hash: false,
				// Do not allow users to close the gallery
				closable: false,
				// Add maximize icon to enlarge the gallery
				showMaximizeIcon: true,
				// Append caption inside the slide item
				// to apply some animation for the captions (Optional)
				appendSubHtmlTo: ".lg-item",
				// Delay slide transition to complete captions animations
				// before navigating to different slides (Optional)
				// You can find caption animation demo on the captions demo page
				slideDelay: 400,
				dynamicEl: data,
			});
			gallery.openGallery();
		});
	}

	return processImageGalleries;
}
