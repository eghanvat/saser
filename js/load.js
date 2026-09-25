const cssPath = 'css';
const jsPath = 'js';

const section = {
    "menu": [
        {
            "page": "menu",
            "css": ['menu'],
            "js": ['menu']
        },
        {
            "page": "order-status",
            "css": ['order-status'],
            "js": ['order-status']
        }
    ],
    "contact": {
        "css": ['contact'],
    },
    "kitchen": {
        "css": ['kitchen'],
        "js": ['kitchen']
    },
    "auth": [
        {
            "page": "login",
            "css": ['login'],
            "js": {
                'int': [],
                "ext": [
                    ['/js/login.js', '', 'module'],
                    //["https://accounts.google.com/gsi/client", "defer"]
                ]
            }
        }
    ],

}

const path = window.location.pathname.split('/');
console.log(path)

$.get("/part/head.html", function (data) {
    $("head").prepend(data);
    loadPageHead();
    $("html").css({ "visibility": "visible", "opacity": "1" });
});

$.get('/part/nav.html', function (data) {
    $('body').prepend(data);
})

$.get("/part/loginbar.html", function (data) {
    $('body').prepend(data);
})

function loadPageHead() {
    var sec = Object.keys(section).find(sec => path[1] == sec);

    if (sec) {
        //if its an array, then look for specific page further.
        if (Array.isArray(section[sec])) {
            var partArr = section[sec];
            partArr.forEach(el => {
                if (el?.page && (path[2]).includes(el.page)) {
                    loadCss(el?.css);
                    loadJs(el?.js)
                    return;
                }
            });
        } else {
            //just single section with just one index page.
            loadCss(section[sec]?.css);
            loadJs(section[sec]?.js);
        }
    }
}

function loadCss(csslist) {
    if (csslist) {
        if (Array.isArray(csslist)) {
            let htmlTags = csslist.map(fileName => {
                return `<link rel="stylesheet" type="text/css" href="/${cssPath}/${fileName}.css">`;
            }).join('\n')
            $("head").append(htmlTags);
        }
    }
}

function loadJs(jslist, type) {
    var htmlTags = '';
    if (jslist) {
        if (Array.isArray(jslist)) {
            if (!type) {
                htmlTags = jslist.map(fileName => {
                    return `<script type="module" src="/${jsPath}/${fileName}.js" defer>`;
                }).join('\n')
            } else {
                htmlTags = jslist.map(arr => {
                    let type = arr[2] || 'text/javascript';
                    let attrs = arr[1] ? ` ${arr[1].trim()}` : '';
                    return `<script type="${type}" src="${arr[0]}"${attrs}></script>`;
                }).join('\n')
            }
            $("head").append(htmlTags);
        } else {
            //contains external links 
            if (Array.isArray(jslist?.int)) {
                loadJs(jslist?.int)
            }
            if (Array.isArray(jslist?.ext)) {
                loadJs(jslist?.ext, true)
            }
        }
    }
}
