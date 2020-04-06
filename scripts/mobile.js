if (typeof browser !== 'undefined') {
    chrome = browser
}

var eHtml = document.getElementsByTagName("html")[0]

if (eHtml) {
    var pageLang = eHtml.getAttribute("lang") || eHtml.getAttribute("xml:lang");
}

chrome.storage.local.get("neverTranslateSites").then(onGot => {
    var neverTranslateSites = onGot.neverTranslateSites
    if (!neverTranslateSites) {
        neverTranslateSites = []
    }

    if (neverTranslateSites.indexOf(window.location.hostname) == -1) {
        if (pageLang) {
            pageLang = pageLang.split("-")[0]
            var navigatorLang = navigator.language.split("-")[0]
        
            if (navigatorLang != pageLang) {
                injectPopup()
            }
        } else {
            injectPopup()
        }
    }
})

function readFile(_path, _cb){
    fetch(_path, {mode:'same-origin'})   // <-- important

    .then(function(_res) {
        return _res.blob();
    })

    .then(function(_blob) {
        var reader = new FileReader();

        reader.addEventListener("loadend", function() {
            _cb(this.result);
        });

        reader.readAsText(_blob); 
    })

    .catch( e => console.log(e))
};

function injectPopup()
{
    const element = document.createElement("div")
    element.setAttribute("translate", "no")
    element.classList.add("notranslate")
    element.style = `
        z-index: 100001;
        position: fixed;
        left: 0;
        bottom: 0;
        background-color: white;
        box-shadow: 0px 0px 4px rgba(0, 0, 0, 1);
        width: 100%;
        height: 50px;
        user-select: none;
    `

    const shadowRoot = element.attachShadow({mode: 'closed'})

    readFile(chrome.runtime.getURL("scripts/mobile.html"), (data) => {
        shadowRoot.innerHTML = data

        document.body.appendChild(element)
    
        let btnCloseIsClicked = false
    
        window.addEventListener("scroll", () => {
            if (window.pageYOffset < 10 && !btnCloseIsClicked) {
                element.style.display = "block"
            } else {
                element.style.display = "none"
            }
        })
    
        const btnOriginal = shadowRoot.getElementById("btnOriginal")
        const btnTranslate= shadowRoot.getElementById("btnTranslate")
        const spin = shadowRoot.getElementById("spin")
        const btnMenu = shadowRoot.getElementById("btnMenu")
        const menu = shadowRoot.getElementById("menu")
        const btnNeverTranslate = shadowRoot.getElementById("btnNeverTranslate")
        const btnDonate = shadowRoot.getElementById("btnDonate")
        const btnClose = shadowRoot.getElementById("btnClose")

        btnOriginal.textContent = chrome.i18n.getMessage("btnMobileOriginal")
        btnTranslate.textContent = chrome.i18n.getMessage("btnMobileTranslated")
        btnNeverTranslate.textContent = chrome.i18n.getMessage("btnMobileNeverTranslate")
        btnDonate.textContent = chrome.i18n.getMessage("btnMobileDonate")
        btnDonate.innerHTML += " &#10084;"
    
        btnOriginal.addEventListener("click", () => {
            chrome.runtime.sendMessage({action: "Restore"})
            btnOriginal.style.color = "#2196F3"
            btnTranslate.style.color = "black"
        })
    
        btnTranslate.addEventListener("click", () => {
            chrome.runtime.sendMessage({action: "Translate"})
            btnOriginal.style.color = "black"
            btnTranslate.style.color = "#2196F3"
            btnTranslate.style.display = "none"
            spin.style.display = "block"
    
            let updateStatus = () => {
                chrome.runtime.sendMessage({action: "getStatus"}, response => {
                    if (typeof response == "string" && response != "progress") {
                        btnTranslate.style.display = "block"
                        spin.style.display = "none"
                        btnTranslate.style.color = "#2196F3"
                    } else {
                        setTimeout(updateStatus, 100);
                    }
                })
            }
            updateStatus()
        })

        btnMenu.addEventListener("click", () => {
            menu.style.display = "block"
        })

        document.addEventListener("click", e => {
            if (e.target != element) {
                menu.style.display = "none";
            }
        })

        shadowRoot.addEventListener("click", e => {
            if (e.target != btnMenu) {
                menu.style.display = "none";
            }
        })

        btnNeverTranslate.addEventListener("click", () => {
            chrome.runtime.sendMessage({action: "neverTranslateThisSite"})
            btnCloseIsClicked = true
            element.style.display = "none"
        })
    
        btnClose.addEventListener("click", () => {
            btnCloseIsClicked = true
            element.style.display = "none"
        })
    })
}
