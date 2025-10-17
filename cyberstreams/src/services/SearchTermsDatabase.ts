/**
 * CYBERSECURITY SEARCH TERMS DATABASE
 * 75 søgeord/udtryk på dansk og engelsk for kombinations-søgning
 */

export interface SearchTerm {
  id: string
  danish: string
  english: string
  category: 'threat' | 'security' | 'infrastructure' | 'governance' | 'technology' | 'incident'
  weight: number // 1-5, højere vægt = vigtigere søgeterm
  combinesWith: string[] // IDs af andre termer der kombineres godt
}

export const CYBERSECURITY_SEARCH_TERMS: SearchTerm[] = [
  // CORE SECURITY TERMS (Vægt 5)
  {
    id: 'cybersecurity',
    danish: 'cybersikkerhed',
    english: 'cyber security',
    category: 'security',
    weight: 5,
    combinesWith: ['threat', 'attack', 'infrastructure', 'strategy']
  },
  {
    id: 'it_security',
    danish: 'IT-sikkerhed',
    english: 'information security',
    category: 'security',
    weight: 5,
    combinesWith: ['data', 'network', 'compliance']
  },
  {
    id: 'information_security',
    danish: 'informationssikkerhed',
    english: 'data security',
    category: 'security',
    weight: 5,
    combinesWith: ['protection', 'breach', 'privacy']
  },
  {
    id: 'network_security',
    danish: 'netværkssikkerhed',
    english: 'network security',
    category: 'security',
    weight: 4,
    combinesWith: ['infrastructure', 'monitoring', 'firewall']
  },

  // DIGITAL TRANSFORMATION (Vægt 4)
  {
    id: 'digitalization',
    danish: 'digitalisering',
    english: 'digitalization',
    category: 'technology',
    weight: 4,
    combinesWith: ['infrastructure', 'services', 'sovereignty']
  },
  {
    id: 'digital_infrastructure',
    danish: 'digital infrastruktur',
    english: 'digital infrastructure',
    category: 'infrastructure',
    weight: 4,
    combinesWith: ['critical', 'cybersecurity', 'cloud']
  },
  {
    id: 'digital_services',
    danish: 'digitale tjenester',
    english: 'digital services',
    category: 'technology',
    weight: 4,
    combinesWith: ['cloud', 'saas', 'security']
  },

  // THREAT LANDSCAPE (Vægt 5)
  {
    id: 'cyber_threat',
    danish: 'cybertrussel',
    english: 'cyber threat',
    category: 'threat',
    weight: 5,
    combinesWith: ['intelligence', 'assessment', 'attack']
  },
  {
    id: 'cyber_attack',
    danish: 'cyberangreb',
    english: 'cyber attack',
    category: 'threat',
    weight: 5,
    combinesWith: ['ransomware', 'phishing', 'malware']
  },
  {
    id: 'ransomware',
    danish: 'ransomware',
    english: 'ransomware',
    category: 'threat',
    weight: 5,
    combinesWith: ['attack', 'malware', 'incident']
  },
  {
    id: 'phishing',
    danish: 'phishing',
    english: 'phishing',
    category: 'threat',
    weight: 5,
    combinesWith: ['email', 'social_engineering', 'spear']
  },
  {
    id: 'hacker',
    danish: 'hacker',
    english: 'hacker',
    category: 'threat',
    weight: 4,
    combinesWith: ['attack', 'threat', 'cybercrime']
  },

  // HYBRID & INFLUENCE (Vægt 4)
  {
    id: 'hybrid_threat',
    danish: 'hybrid trussel',
    english: 'hybrid threat',
    category: 'threat',
    weight: 4,
    combinesWith: ['influence', 'disinformation', 'attack']
  },
  {
    id: 'hybrid_attack',
    danish: 'hybride angreb',
    english: 'hybrid attacks',
    category: 'threat',
    weight: 4,
    combinesWith: ['threat', 'influence', 'campaign']
  },
  {
    id: 'influence_campaigns',
    danish: 'påvirkningskampagner',
    english: 'influence campaigns',
    category: 'threat',
    weight: 4,
    combinesWith: ['disinformation', 'hybrid', 'political']
  },
  {
    id: 'disinformation',
    danish: 'desinformation',
    english: 'disinformation',
    category: 'threat',
    weight: 4,
    combinesWith: ['misinformation', 'influence', 'campaign']
  },
  {
    id: 'misinformation',
    danish: 'misinformation',
    english: 'misinformation',
    category: 'threat',
    weight: 3,
    combinesWith: ['disinformation', 'influence']
  },

  // DATA PROTECTION (Vægt 5)
  {
    id: 'data_protection',
    danish: 'databeskyttelse',
    english: 'data protection',
    category: 'governance',
    weight: 5,
    combinesWith: ['gdpr', 'privacy', 'personal_data']
  },
  {
    id: 'personal_data',
    danish: 'persondata',
    english: 'personal data',
    category: 'governance',
    weight: 5,
    combinesWith: ['protection', 'gdpr', 'privacy']
  },
  {
    id: 'gdpr',
    danish: 'GDPR',
    english: 'GDPR',
    category: 'governance',
    weight: 5,
    combinesWith: ['data_protection', 'compliance', 'privacy']
  },
  {
    id: 'data_breach',
    danish: 'datalæk',
    english: 'data breach',
    category: 'incident',
    weight: 5,
    combinesWith: ['security', 'incident', 'response']
  },
  {
    id: 'privacy',
    danish: 'privatliv',
    english: 'privacy',
    category: 'governance',
    weight: 4,
    combinesWith: ['data_protection', 'gdpr', 'personal_data']
  },

  // CLOUD & TECHNOLOGY (Vægt 4)
  {
    id: 'cloud',
    danish: 'skyen',
    english: 'cloud computing',
    category: 'technology',
    weight: 4,
    combinesWith: ['infrastructure', 'saas', 'adoption']
  },
  {
    id: 'cloud_infrastructure',
    danish: 'skyinfrastruktur',
    english: 'cloud infrastructure',
    category: 'infrastructure',
    weight: 4,
    combinesWith: ['cloud', 'security', 'digital']
  },
  {
    id: 'saas',
    danish: 'SaaS',
    english: 'SaaS',
    category: 'technology',
    weight: 3,
    combinesWith: ['cloud', 'services', 'security']
  },
  {
    id: 'paas',
    danish: 'PaaS',
    english: 'PaaS',
    category: 'technology',
    weight: 3,
    combinesWith: ['cloud', 'infrastructure']
  },

  // AI & ML (Vægt 4)
  {
    id: 'artificial_intelligence',
    danish: 'kunstig intelligens',
    english: 'artificial intelligence',
    category: 'technology',
    weight: 4,
    combinesWith: ['ai', 'machine_learning', 'algorithms']
  },
  {
    id: 'ai',
    danish: 'AI',
    english: 'AI',
    category: 'technology',
    weight: 4,
    combinesWith: ['artificial_intelligence', 'machine_learning']
  },
  {
    id: 'machine_learning',
    danish: 'machine learning',
    english: 'machine learning',
    category: 'technology',
    weight: 4,
    combinesWith: ['ai', 'algorithms', 'artificial_intelligence']
  },
  {
    id: 'algorithms',
    danish: 'algoritmer',
    english: 'algorithms',
    category: 'technology',
    weight: 3,
    combinesWith: ['ai', 'machine_learning']
  },

  // SOVEREIGNTY (Vægt 4)
  {
    id: 'digital_sovereignty',
    danish: 'digital suverænitet',
    english: 'digital sovereignty',
    category: 'governance',
    weight: 4,
    combinesWith: ['data_sovereignty', 'autonomy', 'eu']
  },
  {
    id: 'data_sovereignty',
    danish: 'datasuverænitet',
    english: 'data sovereignty',
    category: 'governance',
    weight: 4,
    combinesWith: ['digital_sovereignty', 'autonomy']
  },
  {
    id: 'digital_autonomy',
    danish: 'digital autonomi',
    english: 'digital autonomy',
    category: 'governance',
    weight: 4,
    combinesWith: ['sovereignty', 'independence']
  },

  // GOVERNANCE & LEGISLATION (Vægt 3-4)
  {
    id: 'legislative_proposal',
    danish: 'lovforslag',
    english: 'legislative proposal',
    category: 'governance',
    weight: 3,
    combinesWith: ['motion', 'consultation', 'strategy']
  },
  {
    id: 'motion_resolution',
    danish: 'beslutningsforslag',
    english: 'motion for resolution',
    category: 'governance',
    weight: 3,
    combinesWith: ['legislative', 'proposal']
  },
  {
    id: 'public_consultation',
    danish: 'høring',
    english: 'public consultation',
    category: 'governance',
    weight: 3,
    combinesWith: ['proposal', 'committee']
  },
  {
    id: 'committee_report',
    danish: 'betænkning',
    english: 'committee report',
    category: 'governance',
    weight: 3,
    combinesWith: ['consultation', 'proposal']
  },

  // STRATEGY & ASSESSMENT (Vægt 4)
  {
    id: 'national_strategy',
    danish: 'national strategi',
    english: 'national strategy',
    category: 'governance',
    weight: 4,
    combinesWith: ['cybersecurity_strategy', 'threat_assessment']
  },
  {
    id: 'cybersecurity_strategy',
    danish: 'cybersikkerhedsstrategi',
    english: 'cybersecurity strategy',
    category: 'governance',
    weight: 4,
    combinesWith: ['national_strategy', 'assessment']
  },
  {
    id: 'threat_assessment',
    danish: 'trusselsvurdering',
    english: 'threat assessment',
    category: 'governance',
    weight: 4,
    combinesWith: ['strategy', 'intelligence', 'analysis']
  },

  // INCIDENT RESPONSE (Vægt 5)
  {
    id: 'incident_handling',
    danish: 'hændelseshåndtering',
    english: 'incident handling',
    category: 'incident',
    weight: 5,
    combinesWith: ['response', 'breach', 'security']
  },
  {
    id: 'incident_response',
    danish: 'incident response',
    english: 'incident response',
    category: 'incident',
    weight: 5,
    combinesWith: ['handling', 'breach', 'security']
  },
  {
    id: 'security_breach',
    danish: 'sikkerhedsbrist',
    english: 'security breach',
    category: 'incident',
    weight: 5,
    combinesWith: ['incident', 'data_breach', 'response']
  },

  // VULNERABILITY MANAGEMENT (Vægt 5)
  {
    id: 'patch_management',
    danish: 'patch management',
    english: 'patch management',
    category: 'security',
    weight: 4,
    combinesWith: ['vulnerability', 'exploit', 'cve']
  },
  {
    id: 'vulnerability',
    danish: 'sårbarhed',
    english: 'vulnerability',
    category: 'security',
    weight: 5,
    combinesWith: ['cve', 'exploit', 'zero_day']
  },
  {
    id: 'vulnerabilities',
    danish: 'sårbarheder',
    english: 'vulnerabilities',
    category: 'security',
    weight: 5,
    combinesWith: ['vulnerability', 'cve', 'patch']
  },
  {
    id: 'cve',
    danish: 'CVE',
    english: 'CVE',
    category: 'security',
    weight: 5,
    combinesWith: ['vulnerability', 'exploit', 'nvd']
  },
  {
    id: 'zero_day',
    danish: 'zero-day',
    english: 'zero-day',
    category: 'threat',
    weight: 5,
    combinesWith: ['vulnerability', 'exploit', 'attack']
  },
  {
    id: 'exploit',
    danish: 'exploit',
    english: 'exploit',
    category: 'threat',
    weight: 5,
    combinesWith: ['vulnerability', 'zero_day', 'attack']
  },

  // MALWARE FAMILY (Vægt 5)
  {
    id: 'malware',
    danish: 'malware',
    english: 'malware',
    category: 'threat',
    weight: 5,
    combinesWith: ['ransomware', 'trojan', 'spyware']
  },
  {
    id: 'spyware',
    danish: 'spyware',
    english: 'spyware',
    category: 'threat',
    weight: 4,
    combinesWith: ['malware', 'trojan']
  },
  {
    id: 'trojan',
    danish: 'trojansk hest',
    english: 'trojan horse',
    category: 'threat',
    weight: 4,
    combinesWith: ['malware', 'spyware']
  },
  {
    id: 'botnet',
    danish: 'botnet',
    english: 'botnet',
    category: 'threat',
    weight: 4,
    combinesWith: ['malware', 'ddos', 'attack']
  },

  // ATTACK VECTORS (Vægt 4-5)
  {
    id: 'ddos',
    danish: 'DDoS',
    english: 'DDoS',
    category: 'threat',
    weight: 4,
    combinesWith: ['attack', 'botnet', 'network']
  },
  {
    id: 'phishing_email',
    danish: 'phishing-e-mail',
    english: 'phishing email',
    category: 'threat',
    weight: 5,
    combinesWith: ['phishing', 'social_engineering', 'spear']
  },
  {
    id: 'spear_phishing',
    danish: 'spear phishing',
    english: 'spear phishing',
    category: 'threat',
    weight: 5,
    combinesWith: ['phishing', 'email', 'targeted']
  },
  {
    id: 'social_engineering',
    danish: 'social engineering',
    english: 'social engineering',
    category: 'threat',
    weight: 4,
    combinesWith: ['phishing', 'human', 'attack']
  },

  // SECURITY OPERATIONS (Vægt 4)
  {
    id: 'security_measures',
    danish: 'sikkerhedsforanstaltninger',
    english: 'security measures',
    category: 'security',
    weight: 4,
    combinesWith: ['monitoring', 'controls', 'compliance']
  },
  {
    id: 'risk_analysis',
    danish: 'risikoanalyse',
    english: 'risk analysis',
    category: 'governance',
    weight: 4,
    combinesWith: ['assessment', 'management', 'security']
  },
  {
    id: 'compliance',
    danish: 'compliance',
    english: 'compliance',
    category: 'governance',
    weight: 4,
    combinesWith: ['gdpr', 'regulation', 'audit']
  },
  {
    id: 'cloud_adoption',
    danish: 'cloud adoption',
    english: 'cloud adoption',
    category: 'technology',
    weight: 3,
    combinesWith: ['cloud', 'security', 'migration']
  },

  // SUPPLY CHAIN & MONITORING (Vægt 4)
  {
    id: 'supply_chain',
    danish: 'supply chain',
    english: 'supply chain',
    category: 'security',
    weight: 4,
    combinesWith: ['security', 'risk', 'third_party']
  },
  {
    id: 'attack_vector',
    danish: 'angrebsvektor',
    english: 'attack vector',
    category: 'threat',
    weight: 4,
    combinesWith: ['vulnerability', 'exploit', 'technique']
  },
  {
    id: 'security_monitoring',
    danish: 'sikkerhedsovervågning',
    english: 'security monitoring',
    category: 'security',
    weight: 4,
    combinesWith: ['threat_intelligence', 'siem', 'detection']
  },
  {
    id: 'threat_intelligence',
    danish: 'trussel efterretning',
    english: 'threat intelligence',
    category: 'security',
    weight: 4,
    combinesWith: ['monitoring', 'analysis', 'ioc']
  },
  {
    id: 'ioc',
    danish: 'IoC',
    english: 'indicator of compromise',
    category: 'security',
    weight: 4,
    combinesWith: ['threat_intelligence', 'detection', 'analysis']
  },

  // GOVERNANCE & SECTORS (Vægt 3-4)
  {
    id: 'political_debate',
    danish: 'politisk debat',
    english: 'political debate',
    category: 'governance',
    weight: 3,
    combinesWith: ['legislation', 'proposal', 'eu']
  },
  {
    id: 'eu_legislation',
    danish: 'EU-lovgivning',
    english: 'EU legislation',
    category: 'governance',
    weight: 4,
    combinesWith: ['political', 'regulation', 'directive']
  },
  {
    id: 'cyberspace',
    danish: 'cyberspace',
    english: 'cyberspace',
    category: 'technology',
    weight: 3,
    combinesWith: ['cyber', 'digital', 'domain']
  },
  {
    id: 'cyber_defence',
    danish: 'cyberforsvar',
    english: 'cyber defence',
    category: 'security',
    weight: 4,
    combinesWith: ['military', 'national', 'strategy']
  },
  {
    id: 'cybercrime',
    danish: 'cyberkriminalitet',
    english: 'cybercrime',
    category: 'threat',
    weight: 4,
    combinesWith: ['law_enforcement', 'investigation', 'prosecution']
  },

  // SECTOR-SPECIFIC (Vægt 4)
  {
    id: 'financial_sector',
    danish: 'finansiel sektor',
    english: 'financial sector',
    category: 'infrastructure',
    weight: 4,
    combinesWith: ['critical_infrastructure', 'banking', 'fintech']
  },
  {
    id: 'critical_infrastructure',
    danish: 'kritisk infrastruktur',
    english: 'critical infrastructure',
    category: 'infrastructure',
    weight: 5,
    combinesWith: ['protection', 'security', 'resilience']
  },
  {
    id: 'iot_security',
    danish: 'IoT-sikkerhed',
    english: 'IoT security',
    category: 'security',
    weight: 4,
    combinesWith: ['devices', 'network', 'embedded']
  },
  {
    id: 'email_security',
    danish: 'e-mail-sikkerhed',
    english: 'email security',
    category: 'security',
    weight: 4,
    combinesWith: ['phishing', 'spf', 'dmarc']
  }
]

// UTILITY FUNCTIONS FOR SEARCH COMBINATIONS
export class SearchTermCombiner {
  
  /**
   * Get all terms by category
   */
  static getTermsByCategory(category: SearchTerm['category']): SearchTerm[] {
    return CYBERSECURITY_SEARCH_TERMS.filter(term => term.category === category)
  }
  
  /**
   * Get terms that combine well with a given term
   */
  static getCombinableTerms(termId: string): SearchTerm[] {
    const baseTerm = CYBERSECURITY_SEARCH_TERMS.find(t => t.id === termId)
    if (!baseTerm) return []
    
    return CYBERSECURITY_SEARCH_TERMS.filter(term => 
      baseTerm.combinesWith.includes(term.id)
    )
  }
  
  /**
   * Generate search combinations for threat intelligence
   */
  static generateThreatSearchCombinations(): string[] {
    const combinations: string[] = []
    const threatTerms = this.getTermsByCategory('threat')
    const securityTerms = this.getTermsByCategory('security')
    
    // Combine high-weight threat terms with security terms
    threatTerms
      .filter(t => t.weight >= 4)
      .forEach(threat => {
        securityTerms
          .filter(s => s.weight >= 4)
          .forEach(security => {
            combinations.push(`${threat.danish} AND ${security.danish}`)
            combinations.push(`${threat.english} AND ${security.english}`)
          })
      })
    
    return combinations
  }
  
  /**
   * Get multilingual search query
   */
  static getMultilingualQuery(termIds: string[]): string {
    const terms = CYBERSECURITY_SEARCH_TERMS.filter(t => termIds.includes(t.id))
    const danishTerms = terms.map(t => t.danish).join(' OR ')
    const englishTerms = terms.map(t => t.english).join(' OR ')
    
    return `(${danishTerms}) OR (${englishTerms})`
  }
}