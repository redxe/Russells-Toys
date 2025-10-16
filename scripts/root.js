// GitHub Copilot
(function () {
    const root = '/pages/';
    let currentPath = root;

    const listingEl = document.getElementById('listing');
    const contentEl = document.getElementById('content');
    const breadcrumbsEl = document.getElementById('breadcrumbs');
    const currentPathEl = document.getElementById('currentPath');
    const fileInfoEl = document.getElementById('fileInfo');
    const searchEl = document.getElementById('search');
    const filterExtEl = document.getElementById('filterExt');
    const homeBtn = document.getElementById('homeBtn');
    const reloadBtn = document.getElementById('reloadBtn');

    homeBtn.addEventListener('click', () => navigateTo(root));
    reloadBtn.addEventListener('click', () => loadPath(currentPath));
    searchEl.addEventListener('input', () => renderItems(latestItems));
    filterExtEl.addEventListener('change', () => renderItems(latestItems));
    window.addEventListener('popstate', e => {
        const p = (e.state && e.state.path) || root;
        navigateTo(p, {
            push: false
        });
    });

    // Keep the most recent items for filtering
    let latestItems = [];

    function setStatus(text) {
        fileInfoEl.textContent = text || '';
    }

    function navigateTo(path, opts = {
        push: true
    }) {
        if (!path.endsWith('/')) path = path;
        currentPath = path;
        if (opts.push !== false) history.pushState({
            path
        }, '', path === root ? '/' : '#' + encodeURIComponent(path));
        currentPathEl.textContent = path;
        setStatus('');
        loadPath(path);
        renderBreadcrumbs(path);
    }

    function renderBreadcrumbs(path) {
        breadcrumbsEl.innerHTML = '';
        const parts = path.replace(/^\/+|\/+$/g, '').split('/');
        let acc = '';
        const frag = document.createDocumentFragment();
        // root
        const rootBtn = document.createElement('button');
        rootBtn.textContent = '/';
        rootBtn.style.background = 'transparent';
        rootBtn.style.border = 'none';
        rootBtn.style.color = 'var(--muted)';
        rootBtn.style.cursor = 'pointer';
        rootBtn.addEventListener('click', () => navigateTo(root));
        frag.appendChild(rootBtn);
        if (parts[0] !== 'pages') {
            // if path doesn't start with pages, still show
        }
        acc = '/';
        for (let i = 1; i < parts.length; i++) {
            const btn = document.createElement('button');
            acc += parts[i] + '/';
            btn.textContent = parts[i];
            btn.style.background = 'transparent';
            btn.style.border = 'none';
            btn.style.color = 'var(--muted)';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', () => navigateTo(acc));
            frag.appendChild(document.createTextNode(' / '));
            frag.appendChild(btn);
        }
        breadcrumbsEl.appendChild(frag);
    }

    async function loadPath(path) {
        // Try to fetch the URL. If it's a directory listing, parse links.
        // If it's a file, display it.
        setListingLoading();
        try {
            let url = path;
            // Ensure trailing slash for directory attempts
            if (!url.endsWith('/') && url.endsWith('/')) {} // no-op
            // First try directory URL (ensure slash)
            const dirUrl = path.endsWith('/') ? path : path + '/';
            let res = await fetch(dirUrl, {
                cache: 'no-store'
            });
            if (res.ok) {
                const ctype = res.headers.get('content-type') || '';
                if (res.url.endsWith('/') || dirUrl !== res.url) {
                    // server responded with directory content or redirect - treat as directory listing
                }
                // If content-type is html and contains links, parse anchors
                const text = await res.text();
                const anchors = parseAnchors(text, dirUrl);
                if (anchors.length > 0) {
                    latestItems = normalizeAnchors(anchors, dirUrl);
                    renderItems(latestItems);
                    setStatus(`${latestItems.length} item(s)`);
                    return;
                }
                // If we didn't find anchors, maybe it's an index.html file content => show as file
                // continue to try fetching the exact path (no slash)
            } else {
                // directory fetch failed, try file fetch
            }

            // Try to fetch as file
            res = await fetch(path, {
                cache: 'no-store'
            });
            if (!res.ok) throw new Error('Not found: ' + path);
            const ctype = res.headers.get('content-type') || '';
            if (ctype.includes('text/html')) {
                showIframe(path);
                setStatus('HTML');
            } else if (ctype.includes('application/javascript') || path.endsWith('.js')) {
                showText(await res.text(), 'javascript');
                setStatus('JS');
            } else if (ctype.includes('css') || path.endsWith('.css')) {
                showText(await res.text(), 'css');
                setStatus('CSS');
            } else if (ctype.includes('json') || path.endsWith('.json')) {
                const raw = await res.text();
                try {
                    const j = JSON.parse(raw);
                    showText(JSON.stringify(j, null, 2), 'json');
                } catch (e) {
                    showText(raw, 'json');
                }
                setStatus('JSON');
            } else if (ctype.includes('text/') || /\.(md|txt|csv|log)$/i.test(path)) {
                showText(await res.text(), 'text');
                setStatus('Text');
            } else {
                // Binary or unknown - show in iframe fallback
                showIframe(path);
                setStatus('Binary/Other');
            }
        } catch (err) {
            listingEl.innerHTML = '<div class="meta" style="padding:12px">Unable to load: ' + (err.message || err) + '</div>';
            contentEl.innerHTML = '<div style="padding:16px;color:var(--muted)">No preview available.</div>';
            setStatus('Error');
        }
    }

    function setListingLoading() {
        listingEl.innerHTML = '<div class="meta" style="padding:12px">Loading…</div>';
    }

    function parseAnchors(htmlText, baseUrl) {
        const doc = new DOMParser().parseFromString(htmlText, 'text/html');
        const anchors = Array.from(doc.querySelectorAll('a[href]'));
        // Filter out parent link and anchors that navigate outside
        return anchors
            .map(a => ({
                href: a.getAttribute('href'),
                text: a.textContent.trim()
            }))
            .filter(a => a.href && !a.href.startsWith('mailto:') && !a.href.startsWith('#'));
    }

    function normalizeAnchors(anchorList, baseUrl) {
        const u = new URL(baseUrl, location.origin);
        return anchorList.map(a => {
            const href = a.href;
            let full;
            try {
                full = new URL(href, u).toString();
            } catch (e) {
                full = href;
            }
            // Only include links under /pages/
            const relative = full.replace(location.origin, '');
            return {
                name: a.text || relative.split('/').pop() || relative,
                href: relative,
                full,
                isDir: relative.endsWith('/')
            };
        }).filter(item => item.href.startsWith('/pages/'));
    }

    function renderItems(items) {
        const q = (searchEl.value || '').toLowerCase().trim();
        const ext = (filterExtEl.value || '').toLowerCase().trim();
        const filtered = items.filter(it => {
            if (q) {
                if (!(it.name.toLowerCase().includes(q) || it.href.toLowerCase().includes(q))) return false;
            }
            if (ext) {
                return it.href.toLowerCase().endsWith(ext);
            }
            return true;
        }).sort((a, b) => {
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        listingEl.innerHTML = '';
        if (filtered.length === 0) {
            listingEl.innerHTML = '<div class="meta" style="padding:12px">No items</div>';
            return;
        }

        for (const it of filtered) {
            const el = document.createElement('div');
            el.className = 'item';
            const left = document.createElement('div');
            left.style.display = 'flex';
            left.style.flexDirection = 'column';
            const title = document.createElement('div');
            title.textContent = it.name;
            title.style.fontWeight = '600';
            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.textContent = it.href.replace('/pages/', '');
            left.appendChild(title);
            left.appendChild(meta);

            const right = document.createElement('div');
            right.style.display = 'flex';
            right.style.alignItems = 'center';
            right.style.gap = '8px';
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = it.isDir ? 'dir' : (getExt(it.href) || 'file');
            right.appendChild(badge);

            el.appendChild(left);
            el.appendChild(right);
            el.addEventListener('click', (e) => {
                if (it.isDir) {
                    navigateTo(it.href.endsWith('/') ? it.href : it.href + '/');
                } else {
                    navigateTo(it.href);
                }
            });
            listingEl.appendChild(el);
        }
    }

    function getExt(path) {
        const m = path.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
        return m ? '.' + m[1].toLowerCase() : '';
    }

    function showIframe(path) {
        contentEl.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src = path;
        iframe.title = path;
        contentEl.appendChild(iframe);
    }

    function showText(text, lang) {
        contentEl.innerHTML = '';
        const pre = document.createElement('pre');
        pre.textContent = text;
        contentEl.appendChild(pre);
    }

    // Initial load: try to use server directory listing or optional index.json
    (async function init() {
        // If there's an index.json in /pages/, prefer that for stable listing
        try {
            const idx = await fetch(root + 'index.json', {
                cache: 'no-store'
            });
            if (idx.ok) {
                const arr = await idx.json();
                // index.json expected to be array of {path,name,isDir}
                latestItems = (Array.isArray(arr) ? arr : []).map(i => {
                    return {
                        name: i.name || i.path.split('/').pop(),
                        href: i.path.startsWith('/') ? i.path : '/pages/' + i.path.replace(/^\/+/, ''),
                        isDir: !!i.isDir
                    };
                });
                renderItems(latestItems);
                navigateTo(root, {
                    push: false
                });
                return;
            }
        } catch (e) {
            /* ignore */ }

        // fallback to parsing default directory listing
        navigateTo(root, {
            push: false
        });
    })();

})();