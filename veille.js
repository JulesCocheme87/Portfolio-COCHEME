document.addEventListener('DOMContentLoaded', () => {
    const veilleContainer = document.getElementById('veille-container');
    const loader = document.getElementById('veille-loader');

    const feeds = [
        {
            name: "CERT-FR (Cybersécurité)",
            url: "https://www.cert.ssi.gouv.fr/feed/",
            tag: "Cyber"
        },
        {
            name: "Developpez.com",
            url: "https://www.developpez.com/index/rss",
            tag: "IT & Dev"
        }
    ];

    const fetchFeed = async (feed) => {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
            if (!response.ok) throw new Error('Erreur réseau');
            const data = await response.json();
            return { feedInfo: feed, items: data.items ? data.items.slice(0, 6) : [] };
        } catch (error) {
            console.error(error);
            return { feedInfo: feed, items: [] };
        }
    };

    const renderArticles = (feedResults) => {
        if (!veilleContainer || !loader) return;

        let allItems = [];
        feedResults.forEach(result => {
            if (result.items) {
                result.items.forEach(item => {
                    allItems.push({ ...item, info: result.feedInfo });
                });
            }
        });

        allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        // Limiter aux 12 plus récents globalement
        allItems = allItems.slice(0, 12);

        let htmlContent = '';

        if (allItems.length === 0) {
            htmlContent = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
                <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">📡</span>
                <h3>Impossible de synchroniser les flux pour le moment. Veuillez réessayer plus tard.</h3>
            </div>`;
        } else {
            allItems.forEach(item => {
                const date = new Date(item.pubDate).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });

                let tempDiv = document.createElement("div");
                tempDiv.innerHTML = item.description || "";
                let textDescription = tempDiv.textContent || tempDiv.innerText || "";
                let shortDescription = textDescription.substring(0, 140) + (textDescription.length > 140 ? '...' : '');

                // Image handling
                let image = item.thumbnail || (item.enclosure ? item.enclosure.link : '');
                let imgHTML = '';
                if (image && image.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                    imgHTML = `<div class="news-image" style="background-image: url('${image}');"></div>`;
                } else {
                    imgHTML = `<div class="news-image placeholder-gradient">
                                  <span style="opacity:0.6; font-size: 2.5rem; filter: saturate(0);">📰</span>
                               </div>`;
                }

                htmlContent += `
                    <a href="${item.link}" target="_blank" style="text-decoration:none; color:inherit; display:block;" class="news-card">
                        ${imgHTML}
                        <div class="news-content">
                            <div class="news-meta">
                                <span style="background: rgba(45, 212, 191, 0.1); color: var(--accent); padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 600; font-size:0.75rem; letter-spacing:0.05em; text-transform:uppercase; border: 1px solid rgba(45, 212, 191, 0.2);">
                                    ${item.info.tag}
                                </span>
                                <span>${date}</span>
                            </div>
                            <h3 class="news-title">${item.title}</h3>
                            <p class="news-desc">${shortDescription}</p>
                            <div class="news-footer">
                                <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">${item.info.name}</span>
                                <span class="read-more">Lire →</span>
                            </div>
                        </div>
                    </a>
                `;
            });
        }

        veilleContainer.innerHTML = htmlContent;
        loader.style.display = 'none';
        veilleContainer.style.display = 'grid';

        if (typeof IntersectionObserver !== 'undefined') {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal-visible');
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('#veille-container .news-card').forEach((el, index) => {
                el.classList.add('reveal-hidden');
                setTimeout(() => { observer.observe(el); }, 100 * (index % 3)); // Staggered animation
            });
        }
    };

    Promise.all(feeds.map(fetchFeed)).then(renderArticles);
});
