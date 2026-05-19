import { ChangeEvent, useCallback, useEffect, useState } from "react";
import {
  NoteEvent,
  Project,
  ProjectBackup,
  SavedProject,
  Track,
} from "../types";
import { INITIAL_PROJECT } from "../constants";
import { AudioManager } from "../lib/audio";
import {
  generateFullSong,
  generateTrack,
  generateSongExtension,
} from "../lib/gemini";
import { importMidi, exportMidi } from "../lib/midi";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isProject = (value: unknown): value is Project =>
  isRecord(value) &&
  typeof value.tempo === "number" &&
  typeof value.totalSteps === "number" &&
  Array.isArray(value.tracks);

const isSavedProject = (value: unknown): value is SavedProject =>
  isRecord(value) && typeof value["updatedAt"] === "number" && isProject(value);

const isProjectBackup = (value: unknown): value is ProjectBackup =>
  isRecord(value) &&
  typeof value.timestamp === "number" &&
  isProject(value.project);

export function useDAW() {
  const AUTOSAVE_KEY = "daw_ashref_tn_autosave";
  const LOCAL_PROJECTS_KEY = "daw_ashref_tn_local_projects";
  const BACKUPS_KEY = "daw_ashref_tn_backups";
  const KEYBOARD_LAYOUT_KEY = "daw_ashref_tn_keyboard_layout";

  const [project, setProject] = useState<Project>(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) {
        return INITIAL_PROJECT;
      }

      const parsed = JSON.parse(saved) as unknown;
      return isProject(parsed) ? parsed : INITIAL_PROJECT;
    } catch {
      return INITIAL_PROJECT;
    }
  });

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    project.tracks[0]?.id || null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [editorView, setEditorView] = useState<"timeline" | "pianoRoll">(
    "timeline",
  );
  const [keyboardLayout, setKeyboardLayoutState] = useState<
    "qwerty" | "azerty"
  >(() => {
    const saved = localStorage.getItem(KEYBOARD_LAYOUT_KEY);
    return saved === "azerty" ? "azerty" : "qwerty";
  });
  const [isKeyboardRecording, setIsKeyboardRecording] = useState(false);

  // Sync to AudioManager whenever project structure affecting sound changes
  // and auto-save
  useEffect(() => {
    AudioManager.syncProject(project);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
  }, [project]);

  // Periodic backup every 10 minutes
  useEffect(() => {
    const BACKUP_INTERVAL = 10 * 60 * 1000;
    const interval = setInterval(() => {
      try {
        const backupsStr = localStorage.getItem(BACKUPS_KEY) || "[]";
        const parsedBackups = JSON.parse(backupsStr) as unknown;
        let backups = Array.isArray(parsedBackups)
          ? parsedBackups.filter(isProjectBackup)
          : [];

        backups.push({
          timestamp: Date.now(),
          project: project,
        });

        // Keep up to 10 backups
        if (backups.length > 10) {
          backups = backups.slice(backups.length - 10);
        }

        localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
      } catch (e) {
        console.error("Failed to create backup", e);
      }
    }, BACKUP_INTERVAL);

    return () => clearInterval(interval);
  }, [project]);

  const saveManual = (name: string) => {
    try {
      const existingStr = localStorage.getItem(LOCAL_PROJECTS_KEY) || "[]";
      const parsedProjects = JSON.parse(existingStr) as unknown;
      const existing = Array.isArray(parsedProjects)
        ? parsedProjects.filter(isSavedProject)
        : [];

      const projectId = project.id || "proj_" + Date.now();
      const updatedProject = { ...project, id: projectId, name };

      const index = existing.findIndex(
        (savedProject) => savedProject.id === projectId,
      );
      if (index >= 0) {
        existing[index] = { ...updatedProject, updatedAt: Date.now() };
      } else {
        existing.push({ ...updatedProject, updatedAt: Date.now() });
      }

      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(existing));
      setProject(updatedProject);
    } catch (e) {
      console.error(e);
      alert("Failed to save project locally");
    }
  };

  const getLocalProjects = useCallback((): SavedProject[] => {
    try {
      const existingStr = localStorage.getItem(LOCAL_PROJECTS_KEY) || "[]";
      const parsedProjects = JSON.parse(existingStr) as unknown;

      return Array.isArray(parsedProjects)
        ? parsedProjects.filter(isSavedProject)
        : [];
    } catch {
      return [];
    }
  }, []);

  const loadLocalProject = (id: string) => {
    try {
      const projects = getLocalProjects();
      const target = projects.find((savedProject) => savedProject.id === id);
      if (target) {
        stopPlayback();
        setProject(target);
        setSelectedTrackId(target.tracks[0]?.id || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteLocalProject = (id: string) => {
    try {
      const projects = getLocalProjects();
      const updated = projects.filter((savedProject) => savedProject.id !== id);
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const newProject = () => {
    stopPlayback();
    const proj: Project = { tempo: 120, totalSteps: 64, tracks: [] };
    setProject(proj);
    setSelectedTrackId(null);
  };

  const getBackups = useCallback((): ProjectBackup[] => {
    try {
      const backupsStr = localStorage.getItem(BACKUPS_KEY) || "[]";
      const parsedBackups = JSON.parse(backupsStr) as unknown;

      return Array.isArray(parsedBackups)
        ? parsedBackups.filter(isProjectBackup)
        : [];
    } catch {
      return [];
    }
  }, []);

  const restoreBackup = (backupId: number) => {
    const backups = getBackups();
    const target = backups.find((backup) => backup.timestamp === backupId);
    if (target) {
      stopPlayback();
      setProject(target.project);
      setSelectedTrackId(target.project.tracks[0]?.id || null);
    }
  };

  const saveToFile = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(project));
    const el = document.createElement("a");
    el.setAttribute("href", dataStr);
    el.setAttribute("download", `daw-ashref-tn-project-${Date.now()}.json`);
    document.body.appendChild(el);
    el.click();
    el.remove();
  };

  const loadFromFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      try {
        const result = readerEvent.target?.result;
        if (typeof result !== "string") {
          return;
        }

        const parsedProject = JSON.parse(result) as unknown;
        if (isProject(parsedProject)) {
          stopPlayback();
          setProject(parsedProject);
          setSelectedTrackId(parsedProject.tracks[0]?.id || null);
        }
      } catch {
        alert("Invalid project file");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const togglePlayback = async () => {
    await AudioManager.init(project);
    const state = AudioManager.togglePlayback();
    setIsPlaying(state === "started");
  };

  const stopPlayback = () => {
    AudioManager.stopPlayback();
    setIsPlaying(false);
  };

  const toggleKeyboardRecording = () => {
    setIsKeyboardRecording((current) => !current);
  };

  const toggleEditorView = () => {
    setEditorView((current) =>
      current === "timeline" ? "pianoRoll" : "timeline",
    );
  };

  const setKeyboardLayout = (layout: "qwerty" | "azerty") => {
    setKeyboardLayoutState(layout);
    localStorage.setItem(KEYBOARD_LAYOUT_KEY, layout);
  };

  const seek = (step: number) => {
    AudioManager.seek(step);
  };

  const setTempo = (tempo: number) => {
    setProject((p) => ({ ...p, tempo }));
    AudioManager.setTempo(tempo);
  };

  const setTotalSteps = (steps: number) => {
    setProject((p) => ({ ...p, totalSteps: Math.max(16, steps) }));
  };

  const addTrack = () => {
    const newTrack: Track = {
      id: "trk_new_" + Date.now(),
      name: "New Track",
      instrument: "square",
      color: "#4E4A42", // Editorial theme default color
      muted: false,
      solo: false,
      volume: -6,
      notes: [],
    };
    setProject((p) => ({ ...p, tracks: [...p.tracks, newTrack] }));
    setSelectedTrackId(newTrack.id);
  };

  const deleteTrack = (id: string) => {
    setProject((p) => {
      const remaining = p.tracks.filter((t) => t.id !== id);
      if (selectedTrackId === id) {
        setSelectedTrackId(remaining.length > 0 ? remaining[0].id : null);
      }
      return { ...p, tracks: remaining };
    });
  };

  const clearTrackNotes = (id: string) => {
    setProject((p) => ({
      ...p,
      tracks: p.tracks.map((t) => (t.id === id ? { ...t, notes: [] } : t)),
    }));
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setProject((p) => ({
      ...p,
      tracks: p.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const addNote = (trackId: string, note: Omit<NoteEvent, "id">) => {
    setProject((p) => ({
      ...p,
      tracks: p.tracks.map((t) => {
        if (t.id === trackId) {
          return {
            ...t,
            notes: [
              ...t.notes,
              { ...note, id: "n_" + Date.now() + Math.random() },
            ],
          };
        }
        return t;
      }),
    }));
  };

  const addKeyboardRecordedNote = (
    trackId: string,
    note: string,
    startStep: number,
    durationSteps: number,
  ) => {
    addNote(trackId, {
      note,
      startStep: Math.max(0, Math.floor(startStep)),
      durationSteps,
      velocity: 0.85,
    });
  };

  const toggleMute = (id: string) => {
    updateTrack(id, { muted: !project.tracks.find((t) => t.id === id)?.muted });
  };

  const toggleSolo = (id: string) => {
    updateTrack(id, { solo: !project.tracks.find((t) => t.id === id)?.solo });
  };

  const handleGenerateFullSong = async (
    prompt: string,
    steps: number = 384,
  ) => {
    try {
      setIsGenerating(true);
      stopPlayback();
      const newProj = await generateFullSong(prompt, steps, project.tempo);
      setProject(newProj);
      if (newProj.tracks.length > 0) setSelectedTrackId(newProj.tracks[0].id);
    } catch (e) {
      console.error(e);
      alert("Failed to generate full song. See console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtendSong = async (prompt: string, numBars: number = 8) => {
    try {
      setIsGenerating(true);
      stopPlayback();
      const addedSteps = numBars * 16;
      const newProj = await generateSongExtension(prompt, project, addedSteps);
      setProject(newProj);
    } catch (e) {
      console.error(e);
      alert("Failed to extend song.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateTrack = async (prompt: string) => {
    try {
      setIsGenerating(true);
      const newTrack = await generateTrack(prompt, project.totalSteps, project);
      setProject((p) => ({ ...p, tracks: [...p.tracks, newTrack] }));
      setSelectedTrackId(newTrack.id);
    } catch (e) {
      console.error(e);
      alert("Failed to generate track.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    exportMidi(project);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      stopPlayback();
      const proj = await importMidi(file);
      setProject(proj);
      setSelectedTrackId(proj.tracks[0]?.id || null);
    } catch (error) {
      console.error(error);
      alert("Failed to import MIDI");
    }
    event.target.value = "";
  };

  return {
    project,
    setProject,
    selectedTrackId,
    setSelectedTrackId,
    isPlaying,
    isGenerating,
    autoScroll,
    setAutoScroll,
    editorView,
    setEditorView,
    toggleEditorView,
    keyboardLayout,
    setKeyboardLayout,
    isKeyboardRecording,
    toggleKeyboardRecording,
    togglePlayback,
    stopPlayback,
    seek,
    setTempo,
    setTotalSteps,
    newProject,
    saveManual,
    getLocalProjects,
    loadLocalProject,
    deleteLocalProject,
    saveToFile,
    loadFromFile,
    getBackups,
    restoreBackup,
    addTrack,
    deleteTrack,
    clearTrackNotes,
    updateTrack,
    addNote,
    addKeyboardRecordedNote,
    toggleMute,
    toggleSolo,
    handleGenerateFullSong,
    handleExtendSong,
    handleGenerateTrack,
    handleExport,
    handleImport,
  };
}
