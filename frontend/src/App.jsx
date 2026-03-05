import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Mic, Image as ImageIcon, Video, FolderOpen, ArrowRight, Download, Copy, Trash2, MessageSquare, Upload, RefreshCw, Users, FileText, Volume2, Music, Code, Terminal, Server } from 'lucide-react';
import VoiceOnboarding from './components/VoiceOnboarding.jsx';
import './index.css';

function Home() {
    return (
        <div className="app-container animate-fade-in">
            <div className="hero-wrapper">
                <div className="hero-badge">🚀 v2.0 AI Multimodal Platform</div>
                <h1>Welcome to <span className="text-gradient">APIBR2 Studio</span></h1>
                <p style={{ textAlign: 'center', fontSize: '1.25rem', maxWidth: '750px', margin: '0 auto 3rem', color: '#94a3b8' }}>
                    Sua central de produção de mídia alimentada por IA. <br />
                    Clone vozes perfeitamente, gere imagens ultra-realistas com Stable Diffusion e baixe vídeos multimidias do mundo todo.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/image-studio" className="btn" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
                        Gerar Imagens
                    </Link>
                    <Link to="/apidocs" className="btn btn-secondary">
                        <Terminal size={18} style={{ marginRight: '8px' }} /> Explorar API
                    </Link>
                </div>
            </div>

            <div className="nav-grid">
                <Link to="/chat-studio" className="nav-item">
                    <div className="glass-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(250, 204, 21, 0.15)', color: '#facc15' }}>
                            <MessageSquare size={32} />
                        </div>
                        <h2>Chat Brain</h2>
                        <p>Assistente de IA local LLM com raciocínio profundo.</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: '#fde047', fontWeight: '600', fontSize: '0.9rem' }}>
                            Iniciar Chat <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                </Link>

                <Link to="/audio-studio" className="nav-item">
                    <div className="glass-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                            <Mic size={32} />
                        </div>
                        <h2>Voice Studio</h2>
                        <p>Clonagem de vozes (XTTSv2) e narrações ultra naturais instântaneas.</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: '#60a5fa', fontWeight: '600', fontSize: '0.9rem' }}>
                            Criar Áudio <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                </Link>

                <Link to="/image-studio" className="nav-item">
                    <div className="glass-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                            <ImageIcon size={32} />
                        </div>
                        <h2>Image Studio</h2>
                        <p>Stable Diffusion 3.5, SDXL e Magic Prompts para criadores de arte e devs.</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: '#f472b6', fontWeight: '600', fontSize: '0.9rem' }}>
                            Gerar Arte <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                </Link>

                <Link to="/video-studio" className="nav-item">
                    <div className="glass-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                            <Video size={32} />
                        </div>
                        <h2>Video Downloader</h2>
                        <p>Busque e baixe mídias do TikTok, Youtube e Instagram via link.</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: '#a78bfa', fontWeight: '600', fontSize: '0.9rem' }}>
                            Acessar Downloader <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                </Link>

                <Link to="/projects" className="nav-item">
                    <div className="glass-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <FolderOpen size={32} />
                        </div>
                        <h2>Meus Projetos</h2>
                        <p>Galeria central de todas as criações do servidor.</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: '#34d399', fontWeight: '600', fontSize: '0.9rem' }}>
                            Ver Projetos <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                </Link>

                <Link to="/apidocs" className="nav-item">
                    <div className="glass-card">
                        <div className="icon-wrapper" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
                            <Code size={32} />
                        </div>
                        <h2>API Specs</h2>
                        <p>Documentação para plugar APIBR2 no n8n, Supabase e sistemas remotos.</p>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: '#fb923c', fontWeight: '600', fontSize: '0.9rem' }}>
                            Ver Documentação <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

function AudioStudio() {
    const API = `http://${window.location.hostname}:3000/api/v1/audio`;

    // ── Main tabs ──────────────────────────────────────────────────────────────
    const [mainTab, setMainTab] = useState('txt2audio'); // 'txt2audio' | 'audio2txt' | 'onboarding'

    // ── TTS / Clone state ──────────────────────────────────────────────────────
    const [ttsMode, setTtsMode] = useState('quick'); // 'quick' | 'clone'
    const [inputText, setInputText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState('pt-BR-FranciscaNeural');
    const [voices, setVoices] = useState([]);
    const [language, setLanguage] = useState('pt');
    const [referenceAudio, setReferenceAudio] = useState(null);
    const [referenceAudioName, setReferenceAudioName] = useState('');

    // ── Voice profiles (saved XTTS clones) ─────────────────────────────────────
    const [savedProfiles, setSavedProfiles] = useState([]);  // voices where is_profile===true
    const [selectedProfileId, setSelectedProfileId] = useState('');  // profile_name of selected
    const [addingVoice, setAddingVoice] = useState(false);
    const [newVoiceName, setNewVoiceName] = useState('');
    const [newVoiceFile, setNewVoiceFile] = useState(null);
    const [newVoiceFileName, setNewVoiceFileName] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [saveProfileMsg, setSaveProfileMsg] = useState('');

    // ── Transcription state ────────────────────────────────────────────────────
    const [transcribeMode, setTranscribeMode] = useState('simple'); // 'simple' | 'speakers'
    const [audioFile, setAudioFile] = useState(null);
    const [audioFileName, setAudioFileName] = useState('');
    const [transLanguage, setTransLanguage] = useState('pt');
    const [maxSpeakers, setMaxSpeakers] = useState(8);
    const [transcriptResult, setTranscriptResult] = useState(null);

    // ── Shared state ───────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [audioResult, setAudioResult] = useState(null);
    const [gallery, setGallery] = useState([]);
    const [gallerySearch, setGallerySearch] = useState('');
    const [galleryModeFilter, setGalleryModeFilter] = useState('all');
    const [galleryProfileFilter, setGalleryProfileFilter] = useState('all');
    const [galleryMinRating, setGalleryMinRating] = useState(0);
    const [gallerySort, setGallerySort] = useState('newest');
    const [galleryPage, setGalleryPage] = useState(1);
    const [galleryPageSize, setGalleryPageSize] = useState(10);

    // ── Load voices on mount (also called after saving a new profile) ──────────
    const loadVoices = () => {
        fetch(`${API}/voices`)
            .then(r => r.json())
            .then(data => {
                if (data.voices) {
                    setVoices(data.voices);
                    const profiles = data.voices.filter(v => v.is_profile);
                    setSavedProfiles(profiles);
                    // Auto-select first profile if none selected
                    if (profiles.length > 0 && !selectedProfileId) {
                        setSelectedProfileId(profiles[0].profile_name);
                    }
                }
            })
            .catch(() => { });
    };

    useEffect(() => { loadVoices(); }, []);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleSaveProfile = async () => {
        if (!newVoiceName.trim() || !newVoiceFile) return;
        setSavingProfile(true);
        setSaveProfileMsg('');
        try {
            const formData = new FormData();
            formData.append('name', newVoiceName.trim());
            formData.append('reference_audio', newVoiceFile);
            const response = await fetch(`${API}/voices/clone/save`, { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) {
                setSaveProfileMsg(`Erro: ${data.message || 'Falha ao salvar perfil.'}`);
                return;
            }
            setSaveProfileMsg(`✅ Perfil "${data.display_name}" salvo! (${data.duration_seconds}s)`);
            setNewVoiceName('');
            setNewVoiceFile(null);
            setNewVoiceFileName('');
            setAddingVoice(false);
            // Reload voices to include new profile and auto-select it
            await loadVoices();
            setSelectedProfileId(data.profile_name);
        } catch (e) {
            setSaveProfileMsg('Erro de conexão ao salvar perfil.');
        } finally {
            setSavingProfile(false);
        }
    };

    const sanitizeFilenamePart = (value) => {
        if (!value) return '';
        return String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\.[a-z0-9]{1,5}$/i, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase()
            .slice(0, 40);
    };

    const detectAudioExtension = (audioBase64) => {
        const match = audioBase64?.match(/^data:audio\/([^;]+);base64,/i);
        const mimeSubtype = (match?.[1] || '').toLowerCase();
        if (mimeSubtype.includes('mpeg') || mimeSubtype.includes('mp3')) return 'mp3';
        if (mimeSubtype.includes('ogg')) return 'ogg';
        if (mimeSubtype.includes('wav') || mimeSubtype.includes('wave')) return 'wav';
        if (mimeSubtype.includes('webm')) return 'webm';
        return 'wav';
    };

    const buildAudioFilename = (item) => {
        const parts = [
            'audio',
            sanitizeFilenamePart(item.mode === 'clone' ? 'clone' : 'tts'),
            sanitizeFilenamePart(item.model || 'sem-modelo'),
            sanitizeFilenamePart(item.profile || ''),
            sanitizeFilenamePart(item.reference_audio_name ? `ref-${item.reference_audio_name}` : ''),
            sanitizeFilenamePart(item.rating ? `${item.rating}estrelas` : ''),
            String(item.id),
        ].filter(Boolean);
        return `${parts.join('_')}.${detectAudioExtension(item.audio_base64)}`;
    };

    const renderSourceSummary = (item) => {
        const bits = [
            item.model ? `modelo: ${item.model}` : null,
            item.mode === 'clone' && item.profile ? `perfil: ${item.profile}` : null,
            item.reference_audio_name ? `ref: ${item.reference_audio_name}` : null,
        ].filter(Boolean);
        return bits.join(' • ');
    };

    const handleGenerate = async () => {
        if (!inputText.trim()) return;
        setLoading(true);
        setError('');
        setAudioResult(null);
        try {
            let response;
            const formData = new FormData();
            if (ttsMode === 'quick') {
                formData.append('text', inputText.trim());
                formData.append('voice', selectedVoice);
                formData.append('language', language);
                response = await fetch(`${API}/generate-speech`, { method: 'POST', body: formData });
            } else if (ttsMode === 'clone') {
                if (!selectedProfileId && !referenceAudio) {
                    setError('Selecione uma voz ou envie um áudio de referência.');
                    setLoading(false);
                    return;
                }

                formData.append('text', inputText.trim());
                formData.append('language', language);

                if (selectedProfileId) {
                    // Keep selected profile even if a one-off reference is uploaded.
                    formData.append('voice_profile_name', selectedProfileId);
                }
                if (referenceAudio) {
                    formData.append('reference_audio', referenceAudio);
                }
                response = await fetch(`${API}/clone-voice`, { method: 'POST', body: formData });
            }
            const data = await response.json();
            if (!response.ok) { setError(data.message || 'Erro ao gerar áudio.'); return; }
            const item = {
                id: Date.now(),
                audio_base64: data.audio_base64,
                text: inputText.trim().slice(0, 80),
                mode: ttsMode,
                language,
                duration: data.duration_seconds,
                model: data.model,
                profile: data.profile_used || data.user_id || null,
                reference_audio_name: ttsMode === 'clone' && referenceAudioName ? referenceAudioName : null,
                note: data.note || null,
                rating: 0,
            };
            setAudioResult(item);
            setGallery(prev => [item, ...prev]);
        } catch (e) {
            setError('Erro de conexão. Verifique se o serviço de áudio está rodando.');
        } finally {
            setLoading(false);
        }
    };

    const handleTranscribe = async () => {
        if (!audioFile) return;
        setLoading(true);
        setError('');
        setTranscriptResult(null);
        try {
            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('language', transLanguage);
            let endpoint = `${API}/transcribe`;
            if (transcribeMode === 'speakers') {
                formData.append('max_speakers', maxSpeakers);
                endpoint = `${API}/transcribe-meeting`;
            }
            const response = await fetch(endpoint, { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) { setError(data.message || 'Erro na transcrição.'); return; }
            setTranscriptResult(data);
        } catch (e) {
            setError('Erro de conexão. Verifique se o serviço de áudio está rodando.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyTranscript = () => {
        const text = transcriptResult?.formatted_text || transcriptResult?.text || '';
        navigator.clipboard.writeText(text);
    };

    const handleDownloadTranscript = () => {
        const text = transcriptResult?.formatted_text || transcriptResult?.text || '';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'transcricao.txt'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadAudio = (item) => {
        const a = document.createElement('a');
        a.href = item.audio_base64;
        a.download = buildAudioFilename(item);
        a.click();
    };

    const removeFromGallery = (id) => setGallery(prev => prev.filter(i => i.id !== id));
    const rateGalleryItem = (id, rating) => {
        setGallery(prev => prev.map(item => (item.id === id ? { ...item, rating } : item)));
        setAudioResult(prev => (prev?.id === id ? { ...prev, rating } : prev));
    };

    const galleryProfiles = useMemo(() => {
        const values = new Set(gallery.map(item => item.profile).filter(Boolean));
        return Array.from(values).sort((a, b) => a.localeCompare(b));
    }, [gallery]);

    const filteredAndSortedGallery = useMemo(() => {
        const query = gallerySearch.trim().toLowerCase();
        const filtered = gallery.filter(item => {
            if (galleryModeFilter !== 'all' && item.mode !== galleryModeFilter) return false;
            if (galleryProfileFilter !== 'all' && (item.profile || '') !== galleryProfileFilter) return false;
            if ((item.rating || 0) < galleryMinRating) return false;
            if (!query) return true;

            const haystack = [
                item.text || '',
                item.model || '',
                item.profile || '',
                item.reference_audio_name || '',
                item.language || '',
            ].join(' ').toLowerCase();
            return haystack.includes(query);
        });

        const sorted = [...filtered];
        sorted.sort((a, b) => {
            if (gallerySort === 'oldest') return a.id - b.id;
            if (gallerySort === 'rating_desc') return (b.rating || 0) - (a.rating || 0) || b.id - a.id;
            if (gallerySort === 'rating_asc') return (a.rating || 0) - (b.rating || 0) || b.id - a.id;
            if (gallerySort === 'duration_desc') return (b.duration || 0) - (a.duration || 0) || b.id - a.id;
            if (gallerySort === 'duration_asc') return (a.duration || 0) - (b.duration || 0) || b.id - a.id;
            return b.id - a.id;
        });
        return sorted;
    }, [gallery, gallerySearch, galleryModeFilter, galleryProfileFilter, galleryMinRating, gallerySort]);

    const galleryTotalPages = Math.max(1, Math.ceil(filteredAndSortedGallery.length / galleryPageSize));
    const currentGalleryPage = Math.min(galleryPage, galleryTotalPages);
    const paginatedGallery = useMemo(() => {
        const start = (currentGalleryPage - 1) * galleryPageSize;
        return filteredAndSortedGallery.slice(start, start + galleryPageSize);
    }, [filteredAndSortedGallery, currentGalleryPage, galleryPageSize]);

    useEffect(() => {
        setGalleryPage(1);
    }, [gallerySearch, galleryModeFilter, galleryProfileFilter, galleryMinRating, gallerySort, galleryPageSize]);

    useEffect(() => {
        if (galleryPage > galleryTotalPages) {
            setGalleryPage(galleryTotalPages);
        }
    }, [galleryPage, galleryTotalPages]);

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="app-container animate-fade-in">
            <Link to="/" className="btn btn-secondary" style={{ marginBottom: '2rem' }}>← Voltar</Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div className="icon-wrapper" style={{ background: 'rgba(59,130,246,0.15)' }}>
                    <Mic size={32} color="#3b82f6" />
                </div>
                <div>
                    <h1 style={{ margin: 0 }}>Estúdio de Áudio</h1>
                    <p style={{ margin: 0, color: '#94a3b8' }}>Síntese, clonagem de voz e transcrição local</p>
                </div>
            </div>

            {/* Main tab toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'txt2audio', label: 'Texto → Áudio', icon: <Volume2 size={16} /> },
                    { key: 'audio2txt', label: 'Áudio → Texto', icon: <FileText size={16} /> },
                    { key: 'onboarding', label: 'Onboarding de Voz', icon: <Mic size={16} /> },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setMainTab(tab.key); setError(''); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                            cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem',
                            background: mainTab === tab.key ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                            color: mainTab === tab.key ? 'white' : '#94a3b8',
                            transition: 'all 0.2s',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', color: '#fca5a5' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* ══ TAB 1: Texto → Áudio ════════════════════════════════════════════ */}
            {mainTab === 'txt2audio' && (
                <div className="glass-card">
                    {/* Mode toggle */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {[
                            { key: 'quick', label: 'Voz Padrão', icon: <Music size={14} /> },
                            { key: 'clone', label: 'Clonar Voz', icon: <Mic size={14} /> },
                        ].map(m => (
                            <button key={m.key} onClick={() => setTtsMode(m.key)} style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                                background: ttsMode === m.key ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)',
                                color: ttsMode === m.key ? '#93c5fd' : '#64748b',
                            }}>{m.icon} {m.label}</button>
                        ))}
                    </div>

                    {/* Text input */}
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Texto para narrar</label>
                    <textarea
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Digite o texto que deseja converter em áudio..."
                        rows={5}
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', fontSize: '0.95rem', resize: 'vertical',
                            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                        }}
                    />
                    <div style={{ textAlign: 'right', color: '#475569', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                        {inputText.length} caracteres
                    </div>

                    {/* Language */}
                    <div style={{ display: 'grid', gridTemplateColumns: ttsMode === 'quick' ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Idioma</label>
                            <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                                width: '100%', padding: '0.6rem', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                color: 'white', fontSize: '0.9rem',
                            }}>
                                <option value="pt">Português BR</option>
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="de">Deutsch</option>
                            </select>
                        </div>
                        {ttsMode === 'quick' && voices.filter(v => v.type === 'standard').length > 0 && (
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    Voz <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.2)', color: '#93c5fd', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.3rem' }}>Padrão</span>
                                </label>
                                <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} style={{
                                    width: '100%', padding: '0.6rem', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                    color: 'white', fontSize: '0.9rem',
                                }}>
                                    {voices.filter(v => v.type === 'standard').map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Clone mode — saved profiles + new voice option */}
                    {ttsMode === 'clone' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            {/* ── Saved profiles section ── */}
                            {/* Header: label + two add-voice buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Voz Clonada</label>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <button
                                        onClick={() => { setAddingVoice(!addingVoice); setSaveProfileMsg(''); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                                            padding: '0.25rem 0.6rem', borderRadius: '6px', border: 'none',
                                            background: addingVoice ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.15)',
                                            color: '#c084fc', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600',
                                        }}
                                    >
                                        <Mic size={11} /> {addingVoice ? 'Cancelar' : '+ Rápida (XTTS)'}
                                    </button>
                                </div>
                            </div>

                            {/* XTTS voice profiles dropdown */}
                            {savedProfiles.length > 0 ? (
                                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                                    <select
                                        value={selectedProfileId}
                                        onChange={e => { setSelectedProfileId(e.target.value); setReferenceAudio(null); setReferenceAudioName(''); }}
                                        style={{
                                            width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px',
                                            background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.35)',
                                            color: 'white', fontSize: '0.9rem',
                                        }}
                                    >
                                        <option value="">— Selecionar voz —</option>
                                        {savedProfiles.some(p => !p.is_finetuned) && (
                                            <optgroup label="⚡ Clonagem Rápida (XTTS)">
                                                {savedProfiles.filter(p => !p.is_finetuned).map(p => (
                                                    <option key={p.profile_name} value={p.profile_name}>
                                                        ⚡ {p.name} ({p.duration_seconds}s){p.cached ? ' — cached' : ''}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {savedProfiles.some(p => p.is_finetuned) && (
                                            <optgroup label="🧠 Fine-tuned (XTTS)">
                                                {savedProfiles.filter(p => p.is_finetuned).map(p => (
                                                    <option key={p.profile_name} value={p.profile_name}>
                                                        🧠 {p.name}{p.cached ? ' — loaded' : ''}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                    {selectedProfileId && (
                                        <div style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: '#a78bfa' }}>
                                            {savedProfiles.find(p => p.profile_name === selectedProfileId)?.is_finetuned
                                                ? '🧠 Modelo fine-tuned selecionado'
                                                : '⚡ Embeddings cached após primeiro uso — geração mais rápida'}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{
                                    padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem',
                                    background: 'rgba(168,85,247,0.08)', border: '1px dashed rgba(168,85,247,0.3)',
                                    color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center',
                                }}>
                                    Nenhuma voz ainda. Use "+ Rápida (XTTS)" para criar um perfil de voz.
                                </div>
                            )}

                            {/* Divider "ou" */}
                            {savedProfiles.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                    <span style={{ color: '#475569', fontSize: '0.8rem' }}>ou enviar referência avulsa</span>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                </div>
                            )}

                            {/* One-off reference upload */}
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.65rem 1rem', borderRadius: '10px', cursor: 'pointer',
                                border: '2px dashed rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.04)',
                                color: referenceAudioName ? '#93c5fd' : '#475569',
                            }}>
                                <Upload size={16} />
                                <span style={{ fontSize: '0.85rem' }}>{referenceAudioName || 'Enviar áudio avulso (5–30s, WAV/MP3/OGG)'}</span>
                                <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => {
                                    if (e.target.files[0]) {
                                        setReferenceAudio(e.target.files[0]);
                                        setReferenceAudioName(e.target.files[0].name);
                                    }
                                }} />
                            </label>
                            {selectedProfileId && referenceAudioName && (
                                <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: '#93c5fd' }}>
                                    Perfil mantido + referência avulsa ativa nesta geração.
                                </div>
                            )}

                            {/* Add new voice panel */}
                            {addingVoice && (
                                <div style={{
                                    marginTop: '1rem', padding: '1rem', borderRadius: '12px',
                                    background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
                                }}>
                                    <p style={{ color: '#c084fc', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                                        🎤 Salvar novo perfil de voz permanente
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Nome do perfil (ex: Miguel, Flavio, Apresentador)"
                                        value={newVoiceName}
                                        onChange={e => setNewVoiceName(e.target.value)}
                                        style={{
                                            width: '100%', padding: '0.6rem', borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(168,85,247,0.3)',
                                            color: 'white', fontSize: '0.9rem', marginBottom: '0.75rem',
                                            outline: 'none', boxSizing: 'border-box',
                                        }}
                                    />
                                    <label style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.65rem 1rem', borderRadius: '8px', cursor: 'pointer',
                                        border: '1px dashed rgba(168,85,247,0.4)', background: 'rgba(168,85,247,0.06)',
                                        color: newVoiceFileName ? '#c084fc' : '#64748b', marginBottom: '0.75rem',
                                        fontSize: '0.85rem',
                                    }}>
                                        <Upload size={15} />
                                        {newVoiceFileName || 'Áudio de referência (5–30s)'}
                                        <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => {
                                            if (e.target.files[0]) {
                                                setNewVoiceFile(e.target.files[0]);
                                                setNewVoiceFileName(e.target.files[0].name);
                                            }
                                        }} />
                                    </label>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile || !newVoiceName.trim() || !newVoiceFile}
                                        style={{
                                            width: '100%', padding: '0.65rem', borderRadius: '8px', border: 'none',
                                            background: savingProfile || !newVoiceName.trim() || !newVoiceFile
                                                ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.6)',
                                            color: 'white', fontWeight: '700', cursor: savingProfile ? 'not-allowed' : 'pointer',
                                            fontSize: '0.9rem', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', gap: '0.5rem',
                                        }}
                                    >
                                        {savingProfile
                                            ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                                            : <><Mic size={15} /> Salvar Perfil</>}
                                    </button>
                                    {saveProfileMsg && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: saveProfileMsg.startsWith('✅') ? '#86efac' : '#fca5a5' }}>
                                            {saveProfileMsg}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !inputText.trim()}
                        style={{
                            width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
                            background: loading || !inputText.trim() ? 'rgba(59,130,246,0.3)' : '#3b82f6',
                            color: 'white', fontSize: '1rem', fontWeight: '700', cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        }}
                    >
                        {loading ? <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Gerando áudio...</> : <><Volume2 size={18} /> Gerar Áudio</>}
                    </button>

                    {/* Audio result */}
                    {audioResult && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <audio controls src={audioResult.audio_base64} style={{ width: '100%', marginBottom: '0.75rem' }} />
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button onClick={() => handleDownloadAudio(audioResult)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'rgba(59,130,246,0.3)', color: '#93c5fd', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <Download size={14} /> Baixar Áudio
                                </button>
                                <span style={{ color: '#475569', fontSize: '0.8rem' }}>
                                    {audioResult.duration?.toFixed(1)}s gerado • {audioResult.mode === 'clone' ? 'Voz clonada' : 'Voz padrão'}
                                </span>
                            </div>
                            {renderSourceSummary(audioResult) && (
                                <div style={{ marginTop: '0.45rem', color: '#93c5fd', fontSize: '0.78rem' }}>
                                    {renderSourceSummary(audioResult)}
                                </div>
                            )}
                            {audioResult.note && (
                                <div style={{ marginTop: '0.45rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                                    {audioResult.note}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ══ TAB 2: Áudio → Texto ════════════════════════════════════════════ */}
            {mainTab === 'audio2txt' && (
                <div className="glass-card">
                    {/* Mode toggle */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {[
                            { key: 'simple', label: 'Transcrição Simples', icon: <FileText size={14} /> },
                            { key: 'speakers', label: 'Com Identificação de Speakers', icon: <Users size={14} /> },
                        ].map(m => (
                            <button key={m.key} onClick={() => { setTranscribeMode(m.key); setTranscriptResult(null); }} style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                                background: transcribeMode === m.key ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)',
                                color: transcribeMode === m.key ? '#93c5fd' : '#64748b',
                            }}>{m.icon} {m.label}</button>
                        ))}
                    </div>

                    {transcribeMode === 'speakers' && (
                        <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#fde68a', fontSize: '0.85rem' }}>
                            ℹ️ Modo reunião: identifica cada participante. Requer HF_TOKEN configurado no .env. Áudios longos podem levar alguns minutos.
                        </div>
                    )}

                    {/* Audio file upload */}
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Arquivo de Áudio</label>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '1.25rem 1rem', borderRadius: '10px', cursor: 'pointer',
                        border: '2px dashed rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.05)',
                        color: audioFileName ? '#93c5fd' : '#475569', marginBottom: '1.5rem',
                    }}>
                        <Upload size={20} />
                        <div>
                            <div style={{ fontWeight: '600' }}>{audioFileName || 'Clique para enviar áudio'}</div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>WAV, MP3, M4A, FLAC, OGG suportados</div>
                        </div>
                        <input type="file" accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg" style={{ display: 'none' }} onChange={e => {
                            if (e.target.files[0]) {
                                setAudioFile(e.target.files[0]);
                                setAudioFileName(e.target.files[0].name);
                                setTranscriptResult(null);
                            }
                        }} />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: transcribeMode === 'speakers' ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Idioma do áudio</label>
                            <select value={transLanguage} onChange={e => setTransLanguage(e.target.value)} style={{
                                width: '100%', padding: '0.6rem', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                color: 'white', fontSize: '0.9rem',
                            }}>
                                <option value="pt">Português BR</option>
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="de">Deutsch</option>
                                <option value="auto">Auto detectar</option>
                            </select>
                        </div>
                        {transcribeMode === 'speakers' && (
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    Máx. speakers: {maxSpeakers}
                                </label>
                                <input type="range" min={2} max={10} value={maxSpeakers} onChange={e => setMaxSpeakers(Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.75rem' }}>
                                    <span>2</span><span>10</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleTranscribe}
                        disabled={loading || !audioFile}
                        style={{
                            width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
                            background: loading || !audioFile ? 'rgba(59,130,246,0.3)' : '#3b82f6',
                            color: 'white', fontSize: '1rem', fontWeight: '700', cursor: loading || !audioFile ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        }}
                    >
                        {loading
                            ? <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Transcrevendo... (aguarde)</>
                            : <><FileText size={18} /> Transcrever</>}
                    </button>

                    {/* Transcript result */}
                    {transcriptResult && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                    {transcriptResult.num_speakers
                                        ? `${transcriptResult.num_speakers} speakers • `
                                        : ''
                                    }
                                    {transcriptResult.duration_audio?.toFixed(0)}s de áudio • {transcriptResult.processing_seconds?.toFixed(0)}s de processamento
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={handleCopyTranscript} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <Copy size={13} /> Copiar
                                    </button>
                                    <button onClick={handleDownloadTranscript} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        <Download size={13} /> .txt
                                    </button>
                                </div>
                            </div>
                            <pre style={{
                                background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1rem',
                                color: '#e2e8f0', fontSize: '0.875rem', lineHeight: '1.7',
                                maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word', fontFamily: 'inherit', border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                {transcriptResult.formatted_text || transcriptResult.text}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* ══ TAB 3: Onboarding de Voz ════════════════════════════════════════ */}
            {mainTab === 'onboarding' && <VoiceOnboarding />}

            {/* ══ Gallery ══════════════════════════════════════════════════════════ */}
            {gallery.length > 0 && mainTab !== 'onboarding' && (
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '1rem' }}>
                        🎵 Sessão atual — {filteredAndSortedGallery.length} de {gallery.length} {gallery.length === 1 ? 'áudio' : 'áudios'}
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '0.6rem',
                        marginBottom: '0.9rem',
                    }}>
                        <input
                            value={gallerySearch}
                            onChange={e => setGallerySearch(e.target.value)}
                            placeholder="Buscar texto, modelo, perfil, ref..."
                            style={{
                                width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                color: 'white', fontSize: '0.82rem', boxSizing: 'border-box',
                            }}
                        />
                        <select value={galleryModeFilter} onChange={e => setGalleryModeFilter(e.target.value)} style={{
                            width: '100%', padding: '0.5rem 0.6rem', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', fontSize: '0.8rem',
                        }}>
                            <option value="all">Modo: todos</option>
                            <option value="clone">Modo: clone</option>
                            <option value="quick">Modo: padrão</option>
                        </select>
                        <select value={galleryProfileFilter} onChange={e => setGalleryProfileFilter(e.target.value)} style={{
                            width: '100%', padding: '0.5rem 0.6rem', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', fontSize: '0.8rem',
                        }}>
                            <option value="all">Perfil: todos</option>
                            {galleryProfiles.map(profile => (
                                <option key={profile} value={profile}>{profile}</option>
                            ))}
                        </select>
                        <select value={galleryMinRating} onChange={e => setGalleryMinRating(Number(e.target.value))} style={{
                            width: '100%', padding: '0.5rem 0.6rem', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', fontSize: '0.8rem',
                        }}>
                            <option value={0}>Nota: todas</option>
                            <option value={1}>Nota: 1+ ★</option>
                            <option value={2}>Nota: 2+ ★</option>
                            <option value={3}>Nota: 3+ ★</option>
                            <option value={4}>Nota: 4+ ★</option>
                            <option value={5}>Nota: 5 ★</option>
                        </select>
                        <select value={gallerySort} onChange={e => setGallerySort(e.target.value)} style={{
                            width: '100%', padding: '0.5rem 0.6rem', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', fontSize: '0.8rem',
                        }}>
                            <option value="newest">Ordem: mais novo</option>
                            <option value="oldest">Ordem: mais antigo</option>
                            <option value="rating_desc">Ordem: melhor nota</option>
                            <option value="rating_asc">Ordem: pior nota</option>
                            <option value="duration_desc">Ordem: maior duração</option>
                            <option value="duration_asc">Ordem: menor duração</option>
                        </select>
                        <select value={galleryPageSize} onChange={e => setGalleryPageSize(Number(e.target.value))} style={{
                            width: '100%', padding: '0.5rem 0.6rem', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white', fontSize: '0.8rem',
                        }}>
                            <option value={10}>10 / página</option>
                            <option value={25}>25 / página</option>
                            <option value={50}>50 / página</option>
                        </select>
                        <button
                            onClick={() => {
                                setGallerySearch('');
                                setGalleryModeFilter('all');
                                setGalleryProfileFilter('all');
                                setGalleryMinRating(0);
                                setGallerySort('newest');
                                setGalleryPage(1);
                            }}
                            style={{
                                width: '100%', padding: '0.5rem 0.6rem', borderRadius: '8px', border: 'none',
                                background: 'rgba(59,130,246,0.2)', color: '#93c5fd', cursor: 'pointer', fontSize: '0.8rem',
                            }}
                        >
                            Limpar
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {paginatedGallery.map(item => (
                            <div key={item.id} style={{
                                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                padding: '0.75rem 1rem', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#cbd5e1', fontSize: '0.875rem', flex: 1, marginRight: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.text}...
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                        <span style={{ color: '#475569', fontSize: '0.75rem', alignSelf: 'center' }}>
                                            {item.mode === 'clone'
                                                ? `🎤 ${item.profile ? item.profile : 'Clone'}`
                                                : '🔊 TTS'} • {item.language}
                                        </span>
                                        <button onClick={() => handleDownloadAudio(item)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', background: 'rgba(59,130,246,0.2)', color: '#93c5fd', cursor: 'pointer', fontSize: '0.75rem' }}>
                                            <Download size={13} />
                                        </button>
                                        <button onClick={() => removeFromGallery(item.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.75rem' }}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                                {renderSourceSummary(item) && (
                                    <div style={{ color: '#93c5fd', fontSize: '0.76rem' }}>
                                        {renderSourceSummary(item)}
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.74rem' }}>Avaliação:</span>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={`${item.id}_star_${star}`}
                                            onClick={() => rateGalleryItem(item.id, star)}
                                            title={`${star} estrela${star > 1 ? 's' : ''}`}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                padding: 0,
                                                cursor: 'pointer',
                                                fontSize: '0.95rem',
                                                lineHeight: 1,
                                                color: star <= (item.rating || 0) ? '#facc15' : '#475569',
                                            }}
                                        >
                                            ★
                                        </button>
                                    ))}
                                    <span style={{ color: '#94a3b8', fontSize: '0.72rem', marginLeft: '0.2rem' }}>
                                        {(item.rating || 0) > 0 ? `${item.rating}/5` : 'sem nota'}
                                    </span>
                                </div>
                                <audio controls src={item.audio_base64} style={{ width: '100%', height: '32px' }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            Página {currentGalleryPage} de {galleryTotalPages}
                        </span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                                onClick={() => setGalleryPage(p => Math.max(1, p - 1))}
                                disabled={currentGalleryPage <= 1}
                                style={{
                                    padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none',
                                    background: currentGalleryPage <= 1 ? 'rgba(255,255,255,0.07)' : 'rgba(59,130,246,0.2)',
                                    color: currentGalleryPage <= 1 ? '#475569' : '#93c5fd',
                                    cursor: currentGalleryPage <= 1 ? 'not-allowed' : 'pointer',
                                    fontSize: '0.75rem',
                                }}
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setGalleryPage(p => Math.min(galleryTotalPages, p + 1))}
                                disabled={currentGalleryPage >= galleryTotalPages}
                                style={{
                                    padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none',
                                    background: currentGalleryPage >= galleryTotalPages ? 'rgba(255,255,255,0.07)' : 'rgba(59,130,246,0.2)',
                                    color: currentGalleryPage >= galleryTotalPages ? '#475569' : '#93c5fd',
                                    cursor: currentGalleryPage >= galleryTotalPages ? 'not-allowed' : 'pointer',
                                    fontSize: '0.75rem',
                                }}
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                </div>
            )}
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

    // Img2Img & Seed State
    const [mode, setMode] = useState('txt2img'); // 'txt2img' or 'img2img'
    const [uploadedImage, setUploadedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [strength, setStrength] = useState(0.75);
    const [seed, setSeed] = useState('');
    const [useFixedSeed, setUseFixedSeed] = useState(false);
    const [magicPromptLoading, setMagicPromptLoading] = useState(false);

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
            const response = await fetch(`http://${window.location.hostname}:5001/models`);
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
                { id: 'SG161222/Realistic_Vision_V5.1_noVAE', name: 'Realistic Vision V5.1 (Ultra Realista)' },
                { id: 'emilianJR/epiCRealism', name: 'EpicRealism (Ultra Definido)' }
            ]);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleMagicPrompt = async () => {
        if (!prompt.trim()) return;
        setMagicPromptLoading(true);
        try {
            // Node Backend (:3000) -> Python (:5003) for Chat/LLM
            const systemPrompt = `You are an elite AI prompt engineer specializing in Stable Diffusion 1.5, SDXL, and DreamShaper 8. 
Your task is to take the user's input (often in simple Portuguese or English) and convert it into a highly detailed, professional English prompt.

RULES:
1. Translate the core concept to English if it's in Portuguese.
2. Format as a comma-separated list of keywords and short descriptive phrases. No conversational text.
3. Add professional photography/art modifiers: "masterpiece, best quality, highly detailed, 8k resolution, cinematic lighting, sharp focus".
4. For Dreamshaper/SD 1.5, negative prompts are important, but you only return the POSITIVE prompt here.
5. Emphasize medium (e.g., "digital painting", "35mm photography", "unreal engine 5 render").
6. RETURN ONLY THE EXACT PROMPT TEXT. No explanations, no quotes around everything.`;

            const response = await fetch(`http://${window.location.hostname}:3000/api/v1/chat/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    model: 'gpt-oss:20b' // Use the smartest available model for best prompt generation
                })
            });
            const data = await response.json();
            if (data.content) {
                setPrompt(data.content.trim().replace(/^"|"$/g, '')); // Remove quotes if any
            }
        } catch (err) {
            console.error('Magic Prompt failed:', err);
            // Fallback: just append some keywords
            setPrompt(prev => prev + ", highly detailed, 8k, photorealistic, cinematic lighting");
        } finally {
            setMagicPromptLoading(false);
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
        if (!prompt.trim() && mode === 'txt2img') {
            setError('Por favor, descreva a imagem que deseja criar.');
            return;
        }

        if (mode === 'img2img' && !uploadedImage) {
            setError('Por favor, faça upload de uma imagem para o modo img2img.');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            let response;
            const endpoint = mode === 'img2img' ? '/img2img' : '/generate';

            if (mode === 'txt2img') {
                response = await fetch(`http://${window.location.hostname}:3000/api/v1/image/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt,
                        model,
                        steps,
                        guidance_scale: guidanceScale,
                        width,
                        height,
                        size: `${width}x${height}`,
                        seed: useFixedSeed && seed ? parseInt(seed) : undefined
                    }),
                });
            } else {
                // img2img uses FormData
                const formData = new FormData();
                formData.append('image', uploadedImage);
                formData.append('prompt', prompt);
                formData.append('model', model);
                formData.append('steps', steps);
                formData.append('guidance_scale', guidanceScale);
                formData.append('strength', strength);
                if (useFixedSeed && seed) {
                    formData.append('seed', seed);
                }

                // Note: The Node backend needs to route this to the Python /img2img endpoint
                // We'll use the same route structure but different endpoint in proxy
                response = await fetch(`http://${window.location.hostname}:3000/api/v1/image/img2img`, {
                    method: 'POST',
                    body: formData, // Auto Content-Type for FormData
                });
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Erro ao gerar imagem');
            }

            const resultData = { ...data.data, metadata: data.metadata };
            setResult(resultData);
            setGallery([{ ...resultData, id: Date.now() }, ...gallery]);
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

                {/* Mode Toggle */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #334155' }}>
                    <button
                        onClick={() => setMode('txt2img')}
                        style={{
                            padding: '0.8rem',
                            background: 'transparent',
                            color: mode === 'txt2img' ? '#ec4899' : '#94a3b8',
                            border: 'none',
                            borderBottom: mode === 'txt2img' ? '2px solid #ec4899' : 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Texto para Imagem
                    </button>
                    <button
                        onClick={() => setMode('img2img')}
                        style={{
                            padding: '0.8rem',
                            background: 'transparent',
                            color: mode === 'img2img' ? '#ec4899' : '#94a3b8',
                            border: 'none',
                            borderBottom: mode === 'img2img' ? '2px solid #ec4899' : 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Imagem para Imagem
                    </button>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    {/* Img2Img Upload Area */}
                    {mode === 'img2img' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: 'bold' }}>
                                Imagem de Referência
                            </label>
                            <div style={{
                                border: '2px dashed #475569',
                                borderRadius: '8px',
                                padding: '1rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: uploadedImage ? 'rgba(0,0,0,0.2)' : 'transparent',
                                position: 'relative'
                            }}>
                                <input
                                    type="file"
                                    onChange={handleImageUpload}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0,
                                        cursor: 'pointer'
                                    }}
                                    accept="image/*"
                                />
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '4px' }} />
                                ) : (
                                    <div style={{ padding: '2rem', color: '#94a3b8' }}>
                                        <div style={{ marginBottom: '0.5rem' }}><Upload size={32} /></div>
                                        <p>Arraste uma imagem ou clique para selecionar</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                                <button
                                    onClick={handleMagicPrompt}
                                    disabled={magicPromptLoading || !prompt.trim()}
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '6px',
                                        padding: '0.8rem',
                                        cursor: magicPromptLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '50px',
                                        opacity: magicPromptLoading ? 0.7 : 1
                                    }}
                                    title="Melhorar Prompt (IA)"
                                >
                                    {magicPromptLoading ? <RefreshCw className="spin" size={18} /> : <span>✨</span>}
                                </button>
                            </div>
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

                        {/* Img2Img Strength */}
                        {mode === 'img2img' && (
                            <div style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Força da Transformação (Strength)</label>
                                    <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{strength}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={strength}
                                    onChange={(e) => setStrength(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                                    <span>Sutil (Mantém original)</span>
                                    <span>Criativo (Muda muito)</span>
                                </div>
                            </div>
                        )}

                        {/* Seed Control */}
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="useFixedSeed"
                                    checked={useFixedSeed}
                                    onChange={(e) => setUseFixedSeed(e.target.checked)}
                                    style={{ accentColor: '#10b981', cursor: 'pointer' }}
                                />
                                <label htmlFor="useFixedSeed" style={{ color: '#cbd5e1', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    Usar Seed Fixa (para reprodutibilidade)
                                </label>
                            </div>

                            {useFixedSeed && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        placeholder="Digite um número de seed..."
                                        value={seed}
                                        onChange={(e) => setSeed(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            background: 'rgba(0,0,0,0.3)',
                                            border: '1px solid #334155',
                                            color: 'white',
                                            borderRadius: '4px'
                                        }}
                                    />
                                    <button
                                        onClick={() => setSeed(Math.floor(Math.random() * 2147483647).toString())}
                                        title="Gerar seed aleatória"
                                        style={{
                                            padding: '0.5rem',
                                            background: '#334155',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            )}
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
                                onClick={() => handleDownloadImage(result.image_base64, `generated-${result.seed || Date.now()}.png`)}
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
                                <p><strong>Modelo:</strong> {result.metadata?.model || result.model}</p>
                                <p><strong>Seed:</strong> {result.seed || result.metadata?.seed || 'N/A'}</p>
                                <p><strong>Tempo:</strong> {result.metadata?.generation_time}s</p>
                                <p><strong>Passos:</strong> {result.metadata?.steps}</p>
                                <p><strong>Guidance Scale:</strong> {result.metadata?.guidance_scale}</p>
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

            const response = await fetch(`http://${window.location.hostname}:3000${endpoint}`, {
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
                <h2>Downloader Universal</h2>
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
                            Link do Vídeo
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
                        <a
                            href={`http://${window.location.hostname}:3000/api/v1/studio/file/download/${encodeURIComponent(result.filename)}`}
                            download
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                marginTop: '1rem',
                                padding: '0.8rem 1.5rem',
                                background: '#10b981',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold'
                            }}
                        >
                            <Download size={18} style={{ marginRight: '8px' }} /> Salvar Arquivo
                        </a>
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
    const [deletingFile, setDeletingFile] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`http://${window.location.hostname}:3000/api/v1/studio/projects`);
            const data = await response.json();
            setProjects(data);
        } catch (err) {
            console.error('Erro ao carregar projetos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadFile = (type, filename) => {
        window.open(`http://${window.location.hostname}:3000/api/v1/studio/file/${type}/${encodeURIComponent(filename)}`, '_blank');
    };

    const handleDeleteFile = async (type, filename) => {
        const confirmed = window.confirm(`Excluir arquivo "${filename}"? Essa ação não pode ser desfeita.`);
        if (!confirmed) return;

        const key = `${type}:${filename}`;
        setDeletingFile(key);
        try {
            const response = await fetch(`http://${window.location.hostname}:3000/api/v1/studio/file/${type}/${encodeURIComponent(filename)}`, {
                method: 'DELETE',
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || data.message || 'Falha ao excluir arquivo');
            }
            await fetchProjects();
        } catch (err) {
            window.alert(`Erro ao excluir: ${err.message}`);
        } finally {
            setDeletingFile('');
        }
    };

    const getFileUrl = (type, filename) => {
        return `http://${window.location.hostname}:3000/api/v1/studio/file/${type}/${encodeURIComponent(filename)}`;
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
                                                    <button
                                                        onClick={() => handleDeleteFile('image', file.name)}
                                                        disabled={deletingFile === `image:${file.name}`}
                                                        style={{
                                                            width: '100%',
                                                            marginTop: '0.5rem',
                                                            padding: '0.6rem',
                                                            background: deletingFile === `image:${file.name}` ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)',
                                                            border: '1px solid rgba(239,68,68,0.35)',
                                                            color: deletingFile === `image:${file.name}` ? '#fda4af' : '#fecaca',
                                                            borderRadius: '6px',
                                                            cursor: deletingFile === `image:${file.name}` ? 'not-allowed' : 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '0.5rem',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        <Trash2 size={16} /> {deletingFile === `image:${file.name}` ? 'Excluindo...' : 'Excluir'}
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

function ChatStudio() {
    const chatModels = [
        { id: 'qwen2.5:3b', name: 'Qwen 2.5 (3B)', desc: '⚡ Padrão: Ótimo para texto, rápido e inteligente.' },
        { id: 'gpt-oss:20b', name: 'GPT-OSS (20B)', desc: '🏆 Campeão de Testes: Mais otimizado e fluido no seu PC.' },
        { id: 'qwen2.5:14b', name: 'Qwen 2.5 (14B)', desc: '🧠 Super Cérebro: Alternativa muito inteligente.' },
        { id: 'codestral:22b', name: 'Codestral (22B)', desc: '💻 Mistral para Código: Excelente para programação.' },
        { id: 'deepseek-coder:33b', name: 'DeepSeek Coder (33B)', desc: '🐳 O Monstro: Pode usar muita RAM (18GB+).' },
        { id: 'qwen2.5:32b', name: 'Qwen 2.5 (32B)', desc: '🎓 O Gênio: Nível GPT-4 Local (20GB RAM).' },
        { id: 'llama3.2:3b', name: 'Llama 3.2 (3B)', desc: '💬 Bom de papo: Equilibrado e amigável.' },
    ];

    const [chatModel, setChatModel] = useState('gpt-oss:20b');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Olá! Sou seu assistente de IA local. Como posso ajudar hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Node Backend (:3000) -> Python (:5003)
            const response = await fetch(`http://${window.location.hostname}:3000/api/v1/chat/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    model: chatModel
                })
            });

            const data = await response.json();

            if (data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            } else {
                throw new Error(data.error || "Erro desconhecido");
            }

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Erro ao conectar com o cérebro local. Verifique se o backend Node e o serviço Python (Porta 5003) estão rodando.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Get current model description
    const currentModelDesc = chatModels.find(m => m.id === chatModel)?.desc || '';

    return (
        <div className="app-container animate-fade-in" style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Link to="/" className="btn btn-secondary">← Voltar</Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ color: '#facc15', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={20} /> Chat Brain
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <select
                            value={chatModel}
                            onChange={(e) => setChatModel(e.target.value)}
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid #334155',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            {chatModels.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                            {currentModelDesc}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                        <div style={{
                            maxWidth: '80%',
                            padding: '1rem',
                            borderRadius: '12px',
                            background: msg.role === 'user' ? '#3b82f6' : '#1e293b',
                            color: 'white',
                            borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                            borderTopLeftRadius: msg.role === 'user' ? '12px' : '2px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {msg.role === 'assistant' && (
                                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    🤖 AI ({chatModel})
                                </div>
                            )}
                            <div style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            background: '#1e293b',
                            color: '#94a3b8'
                        }}>
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    style={{
                        flex: 1,
                        padding: '1rem',
                        borderRadius: '6px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: 'white',
                        fontSize: '1rem'
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="btn"
                    style={{
                        background: '#facc15',
                        color: 'black',
                        fontWeight: 'bold',
                        opacity: loading || !input.trim() ? 0.5 : 1
                    }}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}


function ApiDocs() {
    const examples = [
        {
            title: "Gerar Voz (Clone)",
            method: "POST",
            endpoint: "http://apibr.giesel.com.br/api/v1/audio/generate",
            body: `{\n  "text": "Olá mundo, voz clonada!",\n  "reference_audio_url": "http://exemplo.com/voz.wav",\n  "language": "pt",\n  "mode": "clone"\n}`
        },
        {
            title: "Gerar Imagem (Dreamshaper 8)",
            method: "POST",
            endpoint: "http://apibr.giesel.com.br/api/v1/image/generate",
            body: `{\n  "prompt": "Cyberpunk city at night, neon lights, 4k",\n  "model": "lykon/dreamshaper-8",\n  "steps": 20,\n  "size": "1024x1024"\n}`
        },
        {
            title: "Transcrever Áudio (Whisper)",
            method: "POST",
            endpoint: "http://apibr.giesel.com.br/api/v1/audio/transcribe (FormData)",
            body: `FormData {\n  audio_file: [Arquivo.mp3/wav],\n  language: "pt"\n}`
        },
        {
            title: "Chat / LLM",
            method: "POST",
            endpoint: "http://apibr.giesel.com.br/api/v1/chat/chat",
            body: `{\n  "messages": [\n    {"role": "user", "content": "Me conte uma piada?"}\n  ],\n  "model": "qwen2.5:3b"\n}`
        }
    ];

    return (
        <div className="app-container animate-fade-in" style={{ paddingBottom: '5rem' }}>
            <Link to="/" className="btn btn-secondary" style={{ marginBottom: '2rem' }}>← Voltar para Home</Link>

            <div className="hero-wrapper" style={{ textAlign: 'left', marginBottom: '3rem' }}>
                <h1 style={{ textAlign: 'left', background: 'none', WebkitTextFillColor: 'initial', color: 'white' }}>Documentação <span className="text-gradient">API</span></h1>
                <p>Integre as capacidades da APIBR2 nativamente em suas aplicações, Node, Python, n8n, ou Supabase usando endpoints REST padrão abaixo.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {examples.map((ex, i) => (
                    <div key={i} className="glass-card" style={{ padding: '2rem' }}>
                        <h2 style={{ color: '#60a5fa', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <Server size={24} /> {ex.title}
                        </h2>

                        <div className="docs-endpoint">
                            <span className="docs-method" style={{
                                background: ex.method === 'POST' ? '#3b82f6' : '#10b981'
                            }}>{ex.method}</span>
                            <span style={{ color: '#f8fafc', wordBreak: 'break-all' }}>{ex.endpoint}</span>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Exemplo de Payload (JSON):</p>
                            <pre style={{
                                background: 'rgba(0,0,0,0.5)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#a78bfa',
                                overflowX: 'auto',
                                fontSize: '0.95rem'
                            }}>
                                <code>{ex.body}</code>
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <div className="bg-blobs">
                <div className="blob-1"></div>
                <div className="blob-2"></div>
                <div className="blob-3"></div>
            </div>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/audio-studio" element={<AudioStudio />} />
                <Route path="/image-studio" element={<ImageStudio />} />
                <Route path="/video-studio" element={<VideoStudio />} />
                <Route path="/chat-studio" element={<ChatStudio />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/voice-onboarding" element={<VoiceOnboarding />} />
                <Route path="/apidocs" element={<ApiDocs />} />
            </Routes>
        </Router>
    );
}

export default App;
