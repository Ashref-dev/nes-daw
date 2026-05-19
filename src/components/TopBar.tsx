import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { useDAWContext } from "../context/useDAWContext";
import { ProjectBackup, SavedProject } from "../types";
import {
  Play,
  Square,
  Cpu,
  Music,
  ChevronDown,
  X,
  Search,
  Trash2,
  Settings,
} from "lucide-react";
import { DAWAction } from "../types";

export function TopBar({ actions }: { actions: DAWAction[] }) {
  const {
    project,
    isPlaying,
    togglePlayback,
    stopPlayback,
    setTempo,
    setTotalSteps,
    handleGenerateFullSong,
    handleExtendSong,
    handleExport,
    handleImport,
    newProject,
    saveManual,
    getLocalProjects,
    loadLocalProject,
    deleteLocalProject,
    saveToFile,
    loadFromFile,
    getBackups,
    restoreBackup,
    autoScroll,
    setAutoScroll,
    keyboardLayout,
    setKeyboardLayout,
    isKeyboardRecording,
    toggleKeyboardRecording,
    selectedTrackId,
  } = useDAWContext();
  const [prompt, setPrompt] = useState(
    "A melancholic chiptune song in the style of NieR Automata",
  );
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [backupsOpen, setBackupsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState(project.name || "Untitled Project");

  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localProjectsData, setLocalProjectsData] = useState<SavedProject[]>(
    [],
  );
  const saveNameInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const backups = getBackups();
  const activeTrack = project.tracks.find(
    (track) => track.id === selectedTrackId,
  );
  const filteredLocalProjects = localProjectsData
    .filter((projectItem) =>
      (projectItem.name || "Untitled")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    )
    .sort(
      (firstProject, secondProject) =>
        secondProject.updatedAt - firstProject.updatedAt,
    );

  const openLoadModal = () => {
    setLocalProjectsData(getLocalProjects());
    setLoadModalOpen(true);
    setFileMenuOpen(false);
  };

  const handleDeleteLocalProject = (event: MouseEvent, id: string) => {
    event.stopPropagation();

    if (window.confirm("Delete this project?")) {
      deleteLocalProject(id);
      setLocalProjectsData(getLocalProjects());
    }
  };

  const handleImportFromFile = (event: ChangeEvent<HTMLInputElement>) => {
    loadFromFile(event);
    setFileMenuOpen(false);
  };

  useEffect(() => {
    if (saveModalOpen) {
      saveNameInputRef.current?.focus();
    }
  }, [saveModalOpen]);

  useEffect(() => {
    if (loadModalOpen) {
      searchInputRef.current?.focus();
    }
  }, [loadModalOpen]);

  const handleSave = () => {
    saveManual(saveName);
    setSaveModalOpen(false);
  };

  return (
    <div className="flex h-16 flex-none items-center gap-6 border-b border-[#4E4A42] bg-[#D1CEC1] px-6 font-sans text-[#4E4A42] shadow-sm select-none">
      {/* branding */}
      <div className="flex items-center gap-4 border-r border-[#4E4A42] pr-6">
        <Music size={24} className="text-[#4E4A42] opacity-80" />
        <div className="flex flex-col justify-center">
          <span className="mb-1 text-[9px] leading-none font-bold tracking-[0.2em] uppercase opacity-60">
            Browser MIDI DAW
          </span>
          <h1 className="text-2xl leading-none font-light tracking-tighter uppercase">
            nes-daw
          </h1>
        </div>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            className="flex items-center gap-1 border border-[#4E4A42] bg-transparent px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
          >
            File <ChevronDown size={10} />
          </button>
          {fileMenuOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 flex w-48 flex-col border border-[#4E4A42] bg-[#D1CEC1] py-1 text-[10px] font-bold tracking-widest uppercase shadow-sm">
              <button
                type="button"
                onClick={() => {
                  newProject();
                  setFileMenuOpen(false);
                }}
                className="px-4 py-2 text-left transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
              >
                New Project
              </button>
              <div className="my-1 h-px bg-[#4E4A42] opacity-20" />
              <button
                type="button"
                onClick={() => {
                  setSaveName(project.name || "Untitled Project");
                  setSaveModalOpen(true);
                  setFileMenuOpen(false);
                }}
                className="px-4 py-2 text-left transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
              >
                Save Locally
              </button>
              <button
                type="button"
                onClick={openLoadModal}
                className="px-4 py-2 text-left transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
              >
                Load Locally
              </button>
              <div className="my-1 h-px bg-[#4E4A42] opacity-20" />
              <button
                type="button"
                onClick={() => {
                  saveToFile();
                  setFileMenuOpen(false);
                }}
                className="px-4 py-2 text-left transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
              >
                Save to File (.json)
              </button>
              <label
                htmlFor="project-file-input"
                className="block cursor-pointer px-4 py-2 text-left transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
              >
                Load from File
                <input
                  id="project-file-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportFromFile}
                />
              </label>
              <div className="my-1 h-px bg-[#4E4A42] opacity-20" />
              <button
                type="button"
                onClick={() => {
                  setBackupsOpen(!backupsOpen);
                }}
                className="flex items-center justify-between px-4 py-2 text-left transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
              >
                Restore Backup <ChevronDown size={10} />
              </button>
              {backupsOpen && (
                <div className="flex flex-col border-y border-[#4E4A42] bg-[#BAB5A1]">
                  {backups.map((backup: ProjectBackup) => (
                    <button
                      type="button"
                      key={backup.timestamp}
                      onClick={() => {
                        restoreBackup(backup.timestamp);
                        setFileMenuOpen(false);
                        setBackupsOpen(false);
                      }}
                      className="border-b border-[#4E4A42]/10 px-4 py-1 text-left opacity-80 transition-colors last:border-0 hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
                    >
                      {new Date(backup.timestamp).toLocaleTimeString()}
                    </button>
                  ))}
                  {backups.length === 0 && (
                    <span className="px-4 py-1 opacity-50">No backups</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mx-2 h-6 w-px bg-[#4E4A42] opacity-20" />
        <button
          type="button"
          onClick={togglePlayback}
          className={`flex h-8 w-8 items-center justify-center border border-[#4E4A42] transition-colors ${isPlaying ? "bg-[#4E4A42] text-[#D1CEC1]" : "hover:bg-[#4E4A42] hover:text-[#D1CEC1]"}`}
        >
          <Play size={14} fill={isPlaying ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={stopPlayback}
          className="flex h-8 w-8 items-center justify-center border border-[#4E4A42] transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
        >
          <Square size={14} fill="currentColor" />
        </button>
        <div className="mx-2 h-6 w-px bg-[#4E4A42] opacity-20" />
        <button
          type="button"
          onClick={() => setAutoScroll(!autoScroll)}
          className={`border border-[#4E4A42] px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors ${autoScroll ? "bg-[#4E4A42] text-[#D1CEC1]" : "bg-transparent hover:bg-[#4E4A42] hover:text-[#D1CEC1]"}`}
          title="Toggle Auto-Scroll"
        >
          Snap
        </button>
        <button
          type="button"
          onClick={toggleKeyboardRecording}
          className={`border border-[#4E4A42] px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors ${isKeyboardRecording ? "bg-[#C13A3A] text-[#D1CEC1]" : "bg-transparent hover:bg-[#4E4A42] hover:text-[#D1CEC1]"}`}
          title="Arm keyboard recording while the transport plays"
        >
          Rec Keys
        </button>
      </div>

      {/* Tempo & Info */}
      <div className="flex items-center gap-6 text-[11px] font-bold tracking-widest uppercase">
        <div className="flex flex-col items-end">
          <span className="opacity-50">BPM</span>
          <input
            type="number"
            value={project.tempo}
            onChange={(e) =>
              setTempo(
                Math.max(40, Math.min(300, parseInt(e.target.value) || 120)),
              )
            }
            className="w-12 bg-transparent text-right text-[#4E4A42] transition-opacity outline-none hover:opacity-80"
          />
        </div>
        <div className="h-8 w-px bg-[#4E4A42] opacity-20" />
        <div className="flex flex-col items-center">
          <span className="opacity-50">Length (Bars)</span>
          <div className="mt-[2px] flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setTotalSteps(Math.max(16, project.totalSteps - 16))
              }
              className="flex w-4 items-center justify-center hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
            >
              -
            </button>
            <span>{project.totalSteps / 16}</span>
            <button
              type="button"
              onClick={() => setTotalSteps(project.totalSteps + 16)}
              className="flex w-4 items-center justify-center hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase">
        <div className="flex flex-col items-end">
          <span className="opacity-50">Keyboard</span>
          <span>{keyboardLayout}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="opacity-50">Playing</span>
          <span>{activeTrack ? activeTrack.instrument : "No Track"}</span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex h-8 w-8 items-center justify-center border border-[#4E4A42] transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
            title="Keyboard and action settings"
          >
            <Settings size={14} />
          </button>
          {settingsOpen && (
            <div className="absolute top-full right-0 z-50 mt-2 flex w-80 flex-col gap-4 border border-[#4E4A42] bg-[#D1CEC1] p-4 text-[#4E4A42] shadow-xl">
              <div className="flex items-center justify-between border-b border-[#4E4A42]/30 pb-2">
                <span className="text-[11px] font-bold tracking-widest uppercase">
                  Keyboard Input
                </span>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="hover:opacity-50"
                >
                  <X size={14} />
                </button>
              </div>

              <label
                htmlFor="keyboard-layout-select"
                className="flex flex-col gap-1 text-[10px] font-bold tracking-widest uppercase"
              >
                Layout
                <select
                  id="keyboard-layout-select"
                  value={keyboardLayout}
                  onChange={(event) =>
                    setKeyboardLayout(event.target.value as "qwerty" | "azerty")
                  }
                  className="border border-[#4E4A42] bg-transparent px-2 py-2 font-bold text-[#4E4A42] outline-none"
                >
                  <option value="qwerty">QWERTY</option>
                  <option value="azerty">AZERTY</option>
                </select>
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                  Actions
                </span>
                {actions.map((action) => (
                  <button
                    type="button"
                    key={action.id}
                    onClick={() => void action.run()}
                    className="flex items-center justify-between border border-[#4E4A42]/40 px-2 py-1 text-left transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
                  >
                    <span>{action.label}</span>
                    <kbd className="border border-current px-1 py-0.5 font-mono text-[9px]">
                      {action.shortcut === " " ? "Space" : action.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {/* Generation */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a melancholic song..."
          className="border-opacity-30 placeholder-opacity-50 focus:border-opacity-100 w-64 border-b border-[#4E4A42] bg-transparent px-2 py-1 text-[11px] font-medium tracking-wide text-[#4E4A42] placeholder-[#4E4A42] transition-colors outline-none"
        />
        <button
          type="button"
          onClick={() => handleGenerateFullSong(prompt, 384)}
          className="hover:bg-opacity-80 flex items-center gap-2 bg-[#4E4A42] px-4 py-2 text-[10px] font-bold tracking-[0.2em] whitespace-nowrap text-[#D1CEC1] uppercase shadow-sm transition-colors"
          title="Generate 24 bars (384 steps) of new song"
        >
          <Cpu size={14} />
          Gen
        </button>
        <button
          type="button"
          onClick={() => handleExtendSong(prompt, 8)}
          className="flex items-center gap-2 border border-[#4E4A42] bg-[#BAB5A1] px-4 py-2 text-[10px] font-bold tracking-[0.2em] whitespace-nowrap text-[#4E4A42] uppercase shadow-sm transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
          title="Extend the current song by 8 bars using AI"
        >
          <Cpu size={14} />
          Extend
        </button>
      </div>

      <div className="mx-2 h-8 w-px bg-[#4E4A42] opacity-20" />

      {/* IO */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="border border-[#4E4A42] bg-[#BAB5A1] px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
        >
          Export
        </button>
        <label
          htmlFor="midi-file-input"
          className="cursor-pointer border border-[#4E4A42] bg-[#BAB5A1] px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
        >
          Import
          <input
            id="midi-file-input"
            type="file"
            accept=".mid,.midi"
            className="hidden"
            onChange={handleImport}
          />
        </label>
      </div>

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex w-96 flex-col gap-4 border border-[#4E4A42] bg-[#D1CEC1] p-6 shadow-xl">
            <h2 className="text-xl font-light tracking-tighter uppercase">
              Save Project
            </h2>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="project-name-input"
                className="text-[10px] font-bold tracking-widest uppercase opacity-70"
              >
                Project Name
              </label>
              <input
                id="project-name-input"
                ref={saveNameInputRef}
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="border-b border-[#4E4A42] bg-transparent py-1 text-lg font-bold outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="border border-[#4E4A42] px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="bg-[#4E4A42] px-4 py-2 text-[10px] font-bold tracking-widest text-[#D1CEC1] uppercase transition-opacity hover:opacity-80"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {loadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-[500px] flex-shrink flex-col gap-4 border border-[#4E4A42] bg-[#D1CEC1] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-light tracking-tighter uppercase">
                Load Project
              </h2>
              <button
                type="button"
                onClick={() => setLoadModalOpen(false)}
                className="hover:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-[#4E4A42] pb-1 opacity-70 focus-within:opacity-100">
              <Search size={14} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="SEARCH PROJECTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[11px] font-bold tracking-widest uppercase outline-none"
              />
            </div>

            <div className="flex min-h-[50px] flex-1 flex-col gap-2 overflow-y-auto">
              {filteredLocalProjects.map((projectItem) => (
                <div
                  key={projectItem.id}
                  className="group flex items-center justify-between border border-[#4E4A42] bg-[#BAB5A1] p-3 transition-colors hover:bg-[#4E4A42] hover:text-[#D1CEC1]"
                >
                  <button
                    type="button"
                    className="flex flex-1 cursor-pointer flex-col text-left"
                    onClick={() => {
                      loadLocalProject(projectItem.id ?? "");
                      setLoadModalOpen(false);
                    }}
                  >
                    <span className="font-bold tracking-wider">
                      {projectItem.name || "Untitled"}
                    </span>
                    <span className="mt-1 font-mono text-[10px] opacity-70">
                      {new Date(projectItem.updatedAt).toLocaleString()} •{" "}
                      {projectItem.tracks.length} Tracks
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) =>
                      handleDeleteLocalProject(event, projectItem.id ?? "")
                    }
                    className="rounded p-2 text-[#D1CEC1] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/20"
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {localProjectsData.length === 0 && (
                <div className="py-8 text-center text-[10px] font-bold tracking-widest uppercase opacity-50">
                  No projects found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
