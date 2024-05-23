import MarkdownIt from "markdown-it"
import hljs from "highlight.js"
import mdCodeCopy from './markdown-it-codeblock-plugin.js';
import 'highlight.js/styles/stackoverflow-dark.css';
//import 'highlight.js/styles/devibeans.css';
//import 'highlight.js/styles/github-dark.css';
//import 'highlight.js/styles/base16/google-dark.css';

export function useMarkdown() {

    function mdHighlight(str, lang) {
        
        lang = hljs.getLanguage(lang) ? lang : 'plaintext'
        return '<pre><code>'+ hljs.highlight(str, { language: lang, ignoreIllegals: true }).value + '</code></pre>'

    }

    return new MarkdownIt({
        html: true, // Enable HTML tags in source
        xhtmlOut: true, // Use '/' to close single tags (<br />).
        breaks: true, // Convert '\n' in paragraphs into <br>
        linkify: true, // Autoconvert URL-like text to links
        typographer: true, // Enable some language-neutral replacement + quotes beautification
        quotes: '“”‘’',
        highlight: mdHighlight
    }).use(mdCodeCopy, {})
}


