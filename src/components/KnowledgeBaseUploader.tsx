import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Database,
  Search,
  Tag,
  Calendar,
  User,
  Shield,
} from "lucide-react";

interface KnowledgeDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  source: string;
  date: string;
  classification: string;
  relevance: string;
  uploadedBy: string;
  uploadedAt: string;
}

const KnowledgeBaseUploader = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newDocument, setNewDocument] = useState({
    title: "",
    description: "",
    category: "intelligence_methods",
    tags: "",
    source: "",
    classification: "unclassified",
    relevance: "medium",
  });

  const categories = [
    { id: "all", name: "All Categories" },
    { id: "wikileaks", name: "WikiLeaks Sources" },
    { id: "intelligence_methods", name: "Intelligence Methods" },
    { id: "osint_techniques", name: "OSINT Techniques" },
    { id: "analysis_frameworks", name: "Analysis Frameworks" },
    { id: "intelligence_organizations", name: "Intelligence Organizations" },
  ];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const content = await readFileContent(file);

      const document: KnowledgeDocument = {
        id: `doc-${Date.now()}`,
        title: newDocument.title || file.name,
        description: newDocument.description,
        category: newDocument.category,
        tags: newDocument.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        content: content,
        source: newDocument.source || "Uploaded Document",
        date: new Date().toISOString().split("T")[0],
        classification: newDocument.classification,
        relevance: newDocument.relevance,
        uploadedBy: "Current User",
        uploadedAt: new Date().toISOString(),
      };

      // Upload to knowledge base API
      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(document),
      });

      if (response.ok) {
        setDocuments((prev) => [document, ...prev]);
        setNewDocument({
          title: "",
          description: "",
          category: "intelligence_methods",
          tags: "",
          source: "",
          classification: "unclassified",
          relevance: "medium",
        });
        setShowUploadForm(false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleManualUpload = async () => {
    if (!newDocument.title || !newDocument.description) return;

    setLoading(true);
    try {
      const document: KnowledgeDocument = {
        id: `doc-${Date.now()}`,
        title: newDocument.title,
        description: newDocument.description,
        category: newDocument.category,
        tags: newDocument.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        content: newDocument.description,
        source: newDocument.source || "Manual Entry",
        date: new Date().toISOString().split("T")[0],
        classification: newDocument.classification,
        relevance: newDocument.relevance,
        uploadedBy: "Current User",
        uploadedAt: new Date().toISOString(),
      };

      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(document),
      });

      if (response.ok) {
        setDocuments((prev) => [document, ...prev]);
        setNewDocument({
          title: "",
          description: "",
          category: "intelligence_methods",
          tags: "",
          source: "",
          classification: "unclassified",
          relevance: "medium",
        });
        setShowUploadForm(false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-cyber-blue" />
          <div>
            <h1 className="text-2xl font-bold text-white">
              Intelligence Knowledge Base
            </h1>
            <p className="text-gray-400">
              WikiLeaks Sources & Intelligence Methods
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-4 py-2 bg-cyber-blue hover:bg-cyber-blue/80 rounded text-sm flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={newDocument.title}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                placeholder="Document title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={newDocument.category}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, category: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
              >
                <option value="wikileaks">WikiLeaks Sources</option>
                <option value="intelligence_methods">
                  Intelligence Methods
                </option>
                <option value="osint_techniques">OSINT Techniques</option>
                <option value="analysis_frameworks">Analysis Frameworks</option>
                <option value="intelligence_organizations">
                  Intelligence Organizations
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Source
              </label>
              <input
                type="text"
                value={newDocument.source}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, source: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                placeholder="Document source"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Classification
              </label>
              <select
                value={newDocument.classification}
                onChange={(e) =>
                  setNewDocument({
                    ...newDocument,
                    classification: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
              >
                <option value="unclassified">Unclassified</option>
                <option value="confidential">Confidential</option>
                <option value="secret">Secret</option>
                <option value="top_secret">Top Secret</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newDocument.description}
                onChange={(e) =>
                  setNewDocument({
                    ...newDocument,
                    description: e.target.value,
                  })
                }
                className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                placeholder="Document description and content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={newDocument.tags}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, tags: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
                placeholder="Comma-separated tags"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Relevance
              </label>
              <select
                value={newDocument.relevance}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, relevance: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-blue"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx,.html,.md,.json,.xml,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Upload File
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleManualUpload}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Save Document"}
              </button>
              <button
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              No documents found
            </h3>
            <p className="text-gray-500">
              Upload your first document to start building the knowledge base
            </p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-gray-900 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {doc.title}
                  </h3>
                  <p className="text-gray-400 mb-3">{doc.description}</p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      <span>{doc.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{doc.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{doc.uploadedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          doc.classification === "unclassified"
                            ? "bg-green-500/20 text-green-400"
                            : doc.classification === "confidential"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : doc.classification === "secret"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {doc.classification}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      doc.relevance === "low"
                        ? "bg-gray-500/20 text-gray-400"
                        : doc.relevance === "medium"
                        ? "bg-blue-500/20 text-blue-400"
                        : doc.relevance === "high"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {doc.relevance}
                  </span>
                </div>
              </div>

              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {doc.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-500">
                <strong>Source:</strong> {doc.source}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseUploader;

