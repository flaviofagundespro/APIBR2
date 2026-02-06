import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Mic, Image as ImageIcon, Video, FolderOpen, ArrowRight, Download, Copy, Trash2 } from 'lucide-react';
import './index.css';

function Home() {
    return (
        <div className="app-container animate-fade-in">
            <h1><span className="text-gradient">APIBR2 Studio</span></h1>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto 5rem', color: '#cbd5e1' }}>
                Sua central de produção de mídia de próxima geração. <br />
                Clone vozes, gere imagens ultra-realistas e baixe vídeos em segundos.
            </p>

            <div className="nav-grid">
                <Link to="/audio-studio" className="nav-item">
                    <div className="glass-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                            <Mic size={36} color="#3b82f6" />
                        </div>
                        <h2>Áudio Studio</h2>
                        <p>Clonagem de voz instantânea e processamento de áudio com qualidade de estúdio.</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: '#60a5fa', fontWeight: '600' }}>
                            Acessar Studio <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                </Link>

                <Link to="/image-studio" className="nav-item">
                    <div className="glass-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
                            <ImageIcon size={36} color="#ec4899" />
                        </div>
                        <h2>Image Studio</h2>
                        <p>Crie arte digital deslumbrante com Stable Diffusion 3.5 e Flux.</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: '#f472b6', fontWeight: '600' }}>
                            Criar Imagens <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                </Link>

                <Link to="/video-studio" className="nav-item">
                    <div className="glass-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                            <Video size={36} color="#8b5cf6" />
                        </div>
                        <h2>Video Studio</h2>
                        <p>Download de vídeos do TikTok (sem marca), Instagram, YouTube e mais.</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: '#a78bfa', fontWeight: '600' }}>
                            Baixar Vídeos <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                </Link>

                <Link to="/projects" className="nav-item">
                    <div className="glass-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                            <FolderOpen size={36} color="#10b981" />
                        </div>
                        <h2>Meus Projetos</h2>
                        <p>Galeria centralizada de todos os seus downloads e criações.</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: '#34d399', fontWeight: '600' }}>
                            Ver Galeria <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

function AudioStudio() {
    return (
        <div className="app-container animate-fade-in">
            <Link to="/" className="btn btn-secondary" style={{ marginBottom: '2rem' }}>← Voltar</Link>
            <div className="glass-card">
                <div className="icon-wrapper">
                    <Mic size={32} />
                </div>
                <h2>Estúdio de Áudio</h2>
                <p>Funcionalidades em desenvolvimento. Em breve você poderá clonar vozes e gerar narrações.</p>
            </div>
        </div>
    );
}

function ImageStudio() {
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState('stabilityai/stable-diffusion-3.5');
    const [steps, setSteps] = useState(30);
    const [guidanceScale, setGuidanceScale] = useState(7.5);
    const [width, setWidth] = useState(1024);
    const [height, setHeight] = useState(1024);
    const [sizePreset, setSizePreset] = useState('1024x1024');
    const [customSize, setCustomSize] = useState(false);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [gallery, setGallery] = useState([]);
    const [models, setModels] = useState([]);
    const [estimatedTime, setEstimatedTime] = useState(null);

    useEffect(() => {
        fetchAvailableModels();
    }, []);

    useEffect(() => {
        const estimated = steps * 1.2;
        setEstimatedTime(Math.ceil(estimated));
    }, [steps]);

    const fetchAvailableModels = async () => {
        try {
            // Direct connection to Python server for latest model list
            const response = await fetch('http://localhost:5001/models');
            const data = await response.json();

            if (data.models) {
                // Map the models object to an array of objects for the dropdown
                const modelList = Object.values(data.models).map(m => ({
                    id: m.id || Object.keys(data.models).find(key => data.models[key] === m), // Fallback for ID finding
                    name: m.name
                }));
                // Sort by name for neatness, or keep original order
                setModels(modelList);
                // Set default if current model is not in list
                if (modelList.length > 0) {
                    setModel(modelList[0].id);
                }
            }
        } catch (err) {
            console.error('Erro ao carregar modelos (Python Server 5001):', err);
            // Fallback list as requested
            setModels([
                { id: 'runwayml/stable-diffusion-v1-5', name: 'Stable Diffusion 1.5' },
                { id: 'lykon/dreamshaper-8', name: 'DreamShaper 8' },
                { id: 'prompthero/openjourney', name: 'OpenJourney' },
                { id: 'stabilityai/sdxl-turbo', name: 'SDXL Turbo' },
                { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell - Requer Token' }
            ]);
        }
    };

    const handleSizePresetChange = (preset) => {
        setSizePreset(preset);
        setCustomSize(false);
        const [w, h] = preset.split('x').map(Number);
        setWidth(w);
        setHeight(h);
    };

    const handleCustomSizeChange = () => {
        setCustomSize(true);
        setSizePreset('custom');
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Por favor, descreva a imagem que deseja criar.');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('http://localhost:3000/api/v1/image/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    model,
                    steps,
                    guidance_scale: guidanceScale,
                    width,
                    height,
                    size: `${width}x${height}`
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Erro ao gerar imagem');
            }

            setResult(data.data);
            setGallery([{ ...data.data, id: Date.now() }, ...gallery]);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Erro de conexão. Verifique se o backend está rodando.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(prompt);
        alert('Prompt copiado!');
    };

    const handleDownloadImage = (imageBase64, filename) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${imageBase64}`;
        link.download = filename || 'generated-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteFromGallery = (id) => {
        setGallery(gallery.filter(img => img.id !== id));
    };

    return (
        <div className="app-container animate-fade-in">
            <Link to="/" className="btn btn-secondary" style={{ marginBottom: '2rem' }}>← Voltar</Link>

            <div className="glass-card">
                <div className="icon-wrapper" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)' }}>
                    <ImageIcon size={32} />
                </div>
                <h2>Estúdio de Imagem Avançado</h2>
                <p>Gere imagens incríveis com controle total sobre qualidade e estilo.</p>

                <div style={{ marginTop: '2rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 'bold' }}>
                            Descrição da Imagem
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                style={{
                                    flex: 1,
                                    minHeight: '100px',
                                    background: 'rgba(0,0,0,0.2)',
                                    color: 'white',
                                    border: '1px solid #334155',
                                    borderRadius: '6px',
                                    padding: '0.8rem',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem'
                                }}
                                placeholder="Descreva a imagem que você quer criar. Seja específico sobre estilo, cores, composição..."
                            />
                            <button
                                onClick={handleCopyPrompt}
                                style={{
                                    background: 'rgba(100, 116, 139, 0.5)',
                                    border: '1px solid #475569',
                                    color: 'white',
                                    borderRadius: '6px',
                                    padding: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '50px'
                                }}
                                title="Copiar prompt"
                            >
                                <Copy size={18} />
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 'bold' }}>
                            Modelo de IA
                        </label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'white',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                            Modelos diferentes oferecem diferentes estilos e qualidades
                        </p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 'bold' }}>
                            Tamanho da Imagem
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            {['512x512', '768x768', '1024x1024'].map(size => (
                                <button
                                    key={size}
                                    onClick={() => handleSizePresetChange(size)}
                                    style={{
                                        padding: '0.6rem 1rem',
                                        background: sizePreset === size ? '#ec4899' : 'rgba(0,0,0,0.2)',
                                        color: 'white',
                                        border: '1px solid ' + (sizePreset === size ? '#ec4899' : '#334155'),
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>

                        {customSize && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Largura</label>
                                    <input
                                        type="number"
                                        value={width}
                                        onChange={(e) => setWidth(Number(e.target.value))}
                                        min="256"
                                        max="2048"
                                        step="64"
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem',
                                            background: 'rgba(0,0,0,0.2)',
                                            color: 'white',
                                            border: '1px solid #334155',
                                            borderRadius: '6px',
                                            marginTop: '0.3rem'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Altura</label>
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(Number(e.target.value))}
                                        min="256"
                                        max="2048"
                                        step="64"
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem',
                                            background: 'rgba(0,0,0,0.2)',
                                            color: 'white',
                                            border: '1px solid #334155',
                                            borderRadius: '6px',
                                            marginTop: '0.3rem'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {!customSize && (
                            <button
                                onClick={handleCustomSizeChange}
                                style={{
                                    marginTop: '0.5rem',
                                    padding: '0.4rem 0.8rem',
                                    background: 'rgba(100, 116, 139, 0.3)',
                                    color: '#cbd5e1',
                                    border: '1px dashed #475569',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                + Tamanho Customizado
                            </button>
                        )}
                    </div>

                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <h4 style={{ marginTop: 0, color: '#cbd5e1' }}>⚙️ Controles de Qualidade</h4>

                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Passos de Inferência</label>
                                <span style={{ color: '#ec4899', fontWeight: 'bold' }}>{steps}</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="50"
                                value={steps}
                                onChange={(e) => setSteps(Number(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.3rem 0 0 0' }}>
                                Mais passos = melhor qualidade mas mais lento (Estimado: ~{estimatedTime}s)
                            </p>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Escala de Orientação</label>
                                <span style={{ color: '#ec4899', fontWeight: 'bold' }}>{guidanceScale.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="0.5"
                                value={guidanceScale}
                                onChange={(e) => setGuidanceScale(Number(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.3rem 0 0 0' }}>
                                Controla quanto o modelo segue seu prompt (1=criativo, 20=fiel)
                            </p>
                        </div>
                    </div>

                    <button
                        className="btn"
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        style={{
                            width: '100%',
                            background: '#ec4899',
                            opacity: loading || !prompt.trim() ? 0.5 : 1,
                            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                            padding: '1rem',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {loading ? `Gerando Imagem... (~${estimatedTime}s)` : '✨ Gerar Imagem'}
                    </button>
                </div>

                {error && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.5)'
                    }}>
                        ❌ {error}
                    </div>
                )}

                {result && (
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <h3 style={{ color: '#ec4899', marginBottom: '1rem' }}>✨ Imagem Gerada!</h3>
                        <div style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            display: 'inline-block',
                            marginBottom: '1rem'
                        }}>
                            <img
                                src={`data:image/png;base64,${result.image_base64}`}
                                alt="Generated"
                                style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '8px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => handleDownloadImage(result.image_base64, `generated-${Date.now()}.png`)}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Download size={18} /> Baixar
                            </button>
                        </div>
                        {result.metadata && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.8rem',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                color: '#cbd5e1',
                                textAlign: 'left'
                            }}>
                                <p><strong>Modelo:</strong> {result.metadata.model}</p>
                                <p><strong>Tempo:</strong> {result.metadata.generation_time}s</p>
                                <p><strong>Passos:</strong> {result.metadata.steps}</p>
                                <p><strong>Guidance Scale:</strong> {result.metadata.guidance_scale}</p>
                            </div>
                        )}
                    </div>
                )}

                {gallery.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ color: '#cbd5e1', marginBottom: '1rem' }}>📸 Galeria da Sessão ({gallery.length})</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '1rem'
                        }}>
                            {gallery.map((img) => (
                                <div
                                    key={img.id}
                                    style={{
                                        position: 'relative',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        background: 'rgba(0,0,0,0.3)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <img
                                        src={`data:image/png;base64,${img.image_base64}`}
                                        alt="gallery"
                                        style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                                    />
                                    <button
                                        onClick={() => handleDeleteFromGallery(img.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '0.5rem',
                                            right: '0.5rem',
                                            background: 'rgba(239, 68, 68, 0.8)',
                                            border: 'none',
                                            color: 'white',
                                            borderRadius: '4px',
                                            padding: '0.4rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function VideoStudio() {
    const [activeTab, setActiveTab] = useState('instagram');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const [tiktokQuality, setTiktokQuality] = useState('high');
    const [removeWatermark, setRemoveWatermark] = useState(true);

    const [youtubeQuality, setYoutubeQuality] = useState('720');
    const [audioOnly, setAudioOnly] = useState(false);
    const [downloadPlaylist, setDownloadPlaylist] = useState(false);

    const handleDownload = async () => {
        if (!url.trim()) {
            setError('Por favor, cole uma URL válida.');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            let endpoint = '';
            let body = { url };

            switch (activeTab) {
                case 'instagram':
                    endpoint = '/api/instagram/download';
                    break;
                case 'tiktok':
                    endpoint = '/api/tiktok/download';
                    body = { ...body, quality: tiktokQuality, remove_watermark: removeWatermark };
                    break;
                case 'youtube':
                    endpoint = '/api/youtube/download';
                    body = { ...body, quality: youtubeQuality, audio_only: audioOnly, playlist: downloadPlaylist };
                    break;
                case 'facebook':
                    endpoint = '/api/facebook/download';
                    break;
                case 'amazon':
                    endpoint = '/api/amazon/download';
                    break;
                case 'shopee':
                    endpoint = '/api/shopee/download';
                    break;
                case 'universal':
                    endpoint = '/api/universal/download';
                    break;
                default:
                    throw new Error('Plataforma inválida');
            }

            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.details || data.message || 'Erro ao baixar vídeo');
            }

            setResult(data.data);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Erro de conexão. Verifique se o backend está rodando.');
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ id, label, icon }) => (
        <button
            onClick={() => { setActiveTab(id); setUrl(''); setError(null); setResult(null); }}
            style={{
                padding: '0.8rem 1.2rem',
                background: activeTab === id ? '#8b5cf6' : 'rgba(0,0,0,0.2)',
                color: 'white',
                border: '1px solid ' + (activeTab === id ? '#8b5cf6' : '#334155'),
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontWeight: activeTab === id ? 'bold' : 'normal',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap'
            }}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="app-container animate-fade-in">
            <Link to="/" className="btn btn-secondary" style={{ marginBottom: '2rem' }}>← Voltar</Link>

            <div className="glass-card">
                <div className="icon-wrapper" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
                    <Video size={32} />
                </div>
                <h2>Estúdio de Vídeo Completo</h2>
                <p>Baixe vídeos do Instagram, TikTok, YouTube, Facebook, Amazon, Shopee e muito mais.</p>

                <div style={{
                    marginTop: '2rem',
                    display: 'flex',
                    gap: '0.5rem',
                    borderBottom: '1px solid #334155',
                    marginBottom: 0,
                    overflowX: 'auto',
                    paddingBottom: '2px'
                }}>
                    <TabButton id="instagram" label="Instagram" icon="📷" />
                    <TabButton id="tiktok" label="TikTok" icon="🎵" />
                    <TabButton id="youtube" label="YouTube" icon="▶️" />
                    <TabButton id="facebook" label="Facebook" icon="📘" />
                    <TabButton id="amazon" label="Amazon" icon="🛒" />
                    <TabButton id="shopee" label="Shopee" icon="🛍️" />
                    <TabButton id="universal" label="Outros" icon="🌐" />
                </div>

                <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0 0 8px 8px' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 'bold' }}>
                            URL do Vídeo
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={
                                activeTab === 'instagram' ? 'Cole o link do Instagram...' :
                                    activeTab === 'tiktok' ? 'Cole o link do TikTok...' :
                                        activeTab === 'youtube' ? 'Cole o link do YouTube...' :
                                            activeTab === 'facebook' ? 'Cole o link do Facebook...' :
                                                activeTab === 'amazon' ? 'Cole o link do produto Amazon...' :
                                                    activeTab === 'shopee' ? 'Cole o link do produto Shopee...' :
                                                        'Cole qualquer link de vídeo...'
                            }
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '6px',
                                border: '1px solid #334155',
                                background: '#1e293b',
                                color: 'white',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    {activeTab === 'tiktok' && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                            <h4 style={{ marginTop: 0, color: '#cbd5e1' }}>⚙️ Opções do TikTok</h4>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                    Qualidade
                                </label>
                                <select
                                    value={tiktokQuality}
                                    onChange={(e) => setTiktokQuality(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        background: 'rgba(0,0,0,0.2)',
                                        color: 'white',
                                        border: '1px solid #334155',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="high">Alta (Melhor qualidade)</option>
                                    <option value="medium">Média (Balanceado)</option>
                                    <option value="low">Baixa (Menor tamanho)</option>
                                </select>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={removeWatermark}
                                    onChange={(e) => setRemoveWatermark(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                Remover marca d'água
                            </label>
                        </div>
                    )}

                    {activeTab === 'youtube' && (
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                            <h4 style={{ marginTop: 0, color: '#cbd5e1' }}>⚙️ Opções do YouTube</h4>

                            {!audioOnly && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                        Qualidade do Vídeo
                                    </label>
                                    <select
                                        value={youtubeQuality}
                                        onChange={(e) => setYoutubeQuality(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem',
                                            background: 'rgba(0,0,0,0.2)',
                                            color: 'white',
                                            border: '1px solid #334155',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="360">360p (Menor)</option>
                                        <option value="480">480p</option>
                                        <option value="720">720p (Recomendado)</option>
                                        <option value="1080">1080p (Melhor)</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: 'pointer', marginBottom: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={audioOnly}
                                        onChange={(e) => setAudioOnly(e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    Baixar apenas áudio (MP3)
                                </label>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={downloadPlaylist}
                                    onChange={(e) => setDownloadPlaylist(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                                Baixar playlist completa
                            </label>
                        </div>
                    )}

                    <button
                        onClick={handleDownload}
                        disabled={loading || !url.trim()}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                            opacity: loading || !url.trim() ? 0.5 : 1,
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            transition: 'all 0.3s'
                        }}
                    >
                        {loading ? '⏳ Baixando...' : '⬇️ Baixar Vídeo'}
                    </button>
                </div>

                {error && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.5)'
                    }}>
                        ❌ {error}
                    </div>
                )}

                {result && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#d1fae5',
                        borderRadius: '6px',
                        border: '1px solid rgba(16, 185, 129, 0.5)'
                    }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#6ee7b7' }}>✅ Download Concluído!</h4>
                        <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>
                            <strong>Arquivo:</strong> {result.filename}
                        </p>
                        {result.title && (
                            <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>
                                <strong>Título:</strong> {result.title}
                            </p>
                        )}
                        {result.duration && (
                            <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>
                                <strong>Duração:</strong> {result.duration}
                            </p>
                        )}
                        {result.size && (
                            <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>
                                <strong>Tamanho:</strong> {result.size}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Projects() {
    const [activeTab, setActiveTab] = useState('downloads');
    const [projects, setProjects] = useState({ downloads: [], images: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/v1/studio/projects');
            const data = await response.json();
            setProjects(data);
        } catch (err) {
            console.error('Erro ao carregar projetos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadFile = (type, filename) => {
        window.open(`http://localhost:3000/api/v1/studio/file/${type}/${encodeURIComponent(filename)}`, '_blank');
    };

    const getFileUrl = (type, filename) => {
        return `http://localhost:3000/api/v1/studio/file/${type}/${encodeURIComponent(filename)}`;
    };

    const TabButton = ({ id, label, icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '0.8rem 1.5rem',
                background: activeTab === id ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: activeTab === id ? 'bold' : 'normal',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}
        >
            {icon} {label} ({id === 'downloads' ? projects.downloads.length : projects.images.length})
        </button>
    );

    return (
        <div className="app-container animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <Link to="/" className="btn btn-secondary">← Voltar</Link>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <TabButton id="downloads" label="Downloads" icon={<Download size={18} />} />
                    <TabButton id="images" label="Galeria IA" icon={<ImageIcon size={18} />} />
                </div>
            </div>

            <div className="glass-card">
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        Carregando projetos...
                    </div>
                ) : (
                    <>
                        {activeTab === 'downloads' && (
                            <div>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Video size={28} color="#8b5cf6" /> Meus Downloads
                                </h2>
                                <p>Vídeos e áudios baixados recentemente.</p>

                                {projects.downloads.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                        Nenhum download encontrado.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {projects.downloads.map((file, i) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.05)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        background: 'rgba(139, 92, 246, 0.1)',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#8b5cf6',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {file.thumbnail ? (
                                                            <img
                                                                src={getFileUrl('download', file.thumbnail)}
                                                                alt="thumb"
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            file.name.endsWith('.mp3') ? <Mic size={24} /> : <Video size={24} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, marginBottom: '0.2rem', wordBreak: 'break-all', maxWidth: '400px' }}>
                                                            {file.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadFile('download', file.name)}
                                                    className="btn"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                >
                                                    <Download size={16} style={{ marginRight: '6px' }} /> Baixar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'images' && (
                            <div>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ImageIcon size={28} color="#ec4899" /> Galeria de Imagens
                                </h2>
                                <p>Imagens geradas pela Inteligência Artificial.</p>

                                {projects.images.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                        Nenhuma imagem encontrada.
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                        gap: '1.5rem'
                                    }}>
                                        {projects.images.map((file, i) => (
                                            <div key={i} className="glass-card" style={{ padding: '0', overflow: 'hidden', border: 'none', background: 'rgba(0,0,0,0.2)' }}>
                                                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                                                    <img
                                                        src={getFileUrl('image', file.name)}
                                                        alt={file.name}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            transition: 'transform 0.3s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1.0)'}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://via.placeholder.com/250x200?text=No+Preview';
                                                            e.target.style.opacity = '0.5';
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ padding: '1rem' }}>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        color: '#e2e8f0',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        marginBottom: '0.8rem'
                                                    }} title={file.name}>
                                                        {file.name}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDownloadFile('image', file.name)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.6rem',
                                                            background: 'rgba(255,255,255,0.1)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: 'white',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '0.5rem',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        <FolderOpen size={16} /> Abrir
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/audio-studio" element={<AudioStudio />} />
                <Route path="/image-studio" element={<ImageStudio />} />
                <Route path="/video-studio" element={<VideoStudio />} />
                <Route path="/projects" element={<Projects />} />
            </Routes>
        </Router>
    );
}

export default App;
