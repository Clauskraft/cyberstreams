// List of RSS/Atom feeds monitored by the Cyberstreams platform.  These
// sources include official government advisories, international
// organisations, media outlets and threat intelligence providers.  The
// feeds can be ingested by the backend pipeline (e.g. Logstash →
// Elasticsearch) for continuous monitoring.
const feeds = [
    { title: 'FE Trusselsvurderinger', url: 'https://fe-ddis.dk/rss/trusselsvurderinger.xml' },
    { title: 'EU Council Press Releases', url: 'https://www.consilium.europa.eu/en/press/rss/' },
    { title: 'EEAS FIMI Reports', url: 'https://eeas.europa.eu/headlines/rss' },
    { title: 'NATO News', url: 'https://www.nato.int/cps/en/natolive/news_rss.xml' },
    { title: 'DR Nyheder Indland', url: 'https://www.dr.dk/nyheder/service/rss/allenyheder' },
    { title: 'Altinget Forsvar', url: 'https://www.altinget.dk/artikelrss/103' },
    { title: 'Berlingske Politik', url: 'https://www.berlingske.dk/politik/rss' },
    { title: 'Politiken Digital', url: 'https://politiken.dk/rss' },
    { title: 'Maritime Danmark', url: 'https://www.maritimedanmark.dk/rss/' },
    { title: 'DK-CERT Advisories', url: 'https://cert.dk/rss/advisories.xml' },
    { title: 'CISA Alerts', url: 'https://www.cisa.gov/uscert/ncas/alerts.xml' },
    { title: 'Recorded Future Blog', url: 'https://www.recordedfuture.com/blog/rss.xml' },
    { title: 'VirusTotal Intelligence', url: 'https://blog.virustotal.com/feeds/posts/default' },
    { title: 'Shadowserver Alerts', url: 'https://www.shadowserver.org/news/feed/' },
    { title: 'CEPA Analysis', url: 'https://cepa.org/feed/' },
    { title: 'RAND Security Blog', url: 'https://www.rand.org/topics/cyber-security.xml' },
    { title: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/' },
    { title: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },
    { title: 'CyberScoop', url: 'https://cyberscoop.com/feed/' },
    { title: 'Dark Web Monitor Threats', url: 'https://darkweb-monitoring.pages.dev/feed.xml' }
];
export default feeds;
