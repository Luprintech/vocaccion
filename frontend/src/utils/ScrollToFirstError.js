export const scrollToFirstError = () => {
	const firstError = document.querySelector(".error-field");
	if (firstError) {
		firstError.scrollIntoView({ behavior: "smooth", block: "center" });
		firstError.focus();
	}
};
