addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
    try {
        let cookie_variable = false;
        const cookie = request.headers.get('Cookie');

        if (cookie && cookie.includes("index")) {
            cookie_variable = true;
        }
    //Fetching the variant urls from the API
    let api_resp = await url_request('https://cfw-takehome.developers.workers.dev/api/variants');
    //Fetching urls of the variant by getting JSON response object
    const variant_urls = await api_resp.json();
    //Fetching the index of the variant either from the cookie or from random function
    let variant_index = get_index_url(cookie);
    //Fetching the webpage whose link is provided apart from variant index
    let selected_variant_url = fetch_variant(variant_urls, variant_index);
    //Fetching response of the variant
    if (selected_variant_url) {
        let resp = await url_request(selected_variant_url);
        if (!cookie_variable) {
            resp = new Response(resp.body, resp);
            resp.headers.append('Cookie_Set', `index=${variant_index}; path=/`);
        }
        return changing_resp(resp);
    }
    else {
        throw new Error("Error fetching url");
        }
    }
    catch (e) {
        let e_resp = new Response(`Fatal Error Occurred...Error Details: ${e.message}`);
        e_resp.headers.set('X',e);
        return e_resp
    }
}

class InnerHTMLRewriter{
    constructor(content){
        this.content = content;
    }
    element(element){
        element.setInnerContent(this.content);
    }
}

class AttributeWriter{
    constructor(a_name,a_value){
        this.a_name = a_name;
        this.a_value = a_value;
    }
    element(element){
        element.setAttribute(this.a_name,this.a_value);
    }
}

function changing_resp(response) {
    return new HTMLRewriter()
        .on('title', new InnerHTMLRewriter("COVID'19"))
        .on('h1#title', new InnerHTMLRewriter("Covid'19 Cases across globe"))
        .on('p#description', new InnerHTMLRewriter("Click below to see the total cases of Covid'19"))
        .on('a#url', new AttributeWriter("href", "https://news.google.com/covid19/map?hl=en-US&gl=US&ceid=US:en"))
        .on('a#url', new InnerHTMLRewriter("Go to Stats"))
        .transform(response);
}

function get_index_url(cookie) {
    let variant_index = 0;
    if (cookie && cookie.includes("index=0")) {
        variant_index = 0;
    } else if (cookie && cookie.includes("index=1")) {
        variant_index = 1;
    } else {
        // Choosing variant index with 50% probability of each index to get chosen
        if(Math.random()<0.5){
            variant_index = 0;
        }
        else{
            variant_index = 1;
        }
    }
    return variant_index;
}

function fetch_variant(urls, index) {
    if (urls && urls.variants) {
        return urls.variants[index];
    } else {
        return null;
    }
}

async function url_request(url) {
    let response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error occured:${status}`);
    }
    return response;
}
