// Ref: https://github.com/DCsunset/markdown-it-code-copy

import Clipboard from 'clipboard';

try {
    // Node js will throw an error
    this === window;
    new Clipboard('.markdown-it-code-copy');
}
catch (error) {
    // Do nothing
}
const defaultOptions = {
    iconStyle: 'font-size: 24px; ',
    iconClass: 'mdi mdi-content-copy',
    buttonStyle: 'position:absolute; top:5px; right:5px; cursor:pointer; border:none; opacity:0.6;',
    buttonClass: 'q-btn non-selectable q-btn--actionable q-focusable q-hoverable q-btn--dense'
};

function renderCode(originalRule, options) {
    options = { ...defaultOptions, ...options };
    return (...args) => {
        const [tokens, idx] = args;
        const content = tokens[idx].content
            .replaceAll('"', '&quot;')
            .replaceAll("'", "&apos;");
        const originalRendered = originalRule(...args);

        if (content.length === 0)
            return originalRendered;

        return `
<div class="hljs q-pa-md" style="position: relative; border-radius: 5px; margin-bottom:10px;">
    ${originalRendered}
    <button class="markdown-it-code-copy ${options.buttonClass}" data-clipboard-text="${content}" style="${options.buttonStyle}" title="">
        <span class="q-focus-helper"></span>    
        <span style="${options.iconStyle}" class="${options.iconClass}"></span>
    </button>
</div>
`;
    };
}


export default (md, options) => {
    md.renderer.rules.code_block = renderCode(md.renderer.rules.code_block, options);
    md.renderer.rules.fence = renderCode(md.renderer.rules.fence, options);
};
