// chrome pop display bug workaround
chrome.runtime.getPlatformInfo(info => {
	// this bug occurs only for mac
    if (info.os === 'mac') {
        setTimeout(() => {
			// Increasing body size enforces the popup redrawing
            document.body.style.width = `${document.body.clientWidth + 1}px`;
        }, 250); // 250ms is enough to finish popup open animation
    }
});