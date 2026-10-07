// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

const Dashboard = () => {
  // Create Task States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  
  // List, Search, Filter & Pagination States
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  // Modal States
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, taskId: null });

  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));

  // --- CACHE SETUP ---
  const taskCache = useRef({});
  const CACHE_TTL = 5 * 60 * 1000;

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter]);

  // Fetch API with Pagination & Cache (Allows silent background fetching)
  const fetchTasks = useCallback(async (silent = false) => {
    const limit = 10;
    const cacheKey = `${debouncedSearch}|${statusFilter}|${priorityFilter}|${page}|${limit}`;
    const cachedEntry = taskCache.current[cacheKey];

    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
      setTasks(cachedEntry.data.tasks || []);
      setTotalPages(cachedEntry.data.totalPages || 1);
      return;
    }

    if (!silent) setIsFetching(true);
    try {
      const { data } = await API.get('/tasks', {
        params: { search: debouncedSearch, status: statusFilter, priority: priorityFilter, page, limit }
      });
      
      taskCache.current[cacheKey] = { data, timestamp: Date.now() };
      setTasks(data.tasks || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      if (!silent) setIsFetching(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, page]);

  useEffect(() => {
    if (!user?.token) navigate('/login');
    else fetchTasks();
  }, [navigate, user, fetchTasks]);

  // --- HELPER FUNCTIONS ---
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'No Date';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    if (includeTime) {
      options.hour = 'numeric';
      options.minute = '2-digit';
    }
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // --- OPTIMISTIC MUTATIONS ---
  
  const confirmDelete = (id) => setDeleteModal({ isOpen: true, taskId: id });

  const executeDelete = async () => {
    const idToDelete = deleteModal.taskId || selectedTask?._id;
    if (!idToDelete) return;

    // 1. OPTIMISTIC UI: Remove from UI instantly
    setTasks(prev => prev.filter(t => t._id !== idToDelete));
    setDeleteModal({ isOpen: false, taskId: null });
    setSelectedTask(null);

    // 2. Background Database Sync
    try {
      await API.delete(`/tasks/${idToDelete}`);
      taskCache.current = {}; 
      fetchTasks(true); // Silent sync
    } catch (error) {
      console.error('Failed to delete task', error);
      fetchTasks(); // Revert on failure
    }
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'In Progress' : currentStatus === 'In Progress' ? 'Completed' : 'Pending';
    
    // 1. OPTIMISTIC UI: Update status instantly in lists and modals
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status: nextStatus } : t));
    if (selectedTask?._id === id) {
      setSelectedTask(prev => ({ ...prev, status: nextStatus }));
    }

    // 2. Background Database Sync
    try {
      await API.put(`/tasks/${id}`, { status: nextStatus });
      taskCache.current = {}; 
      fetchTasks(true); // Silent sync
    } catch (error) {
      console.error('Failed to update task', error);
      fetchTasks(); // Revert on failure
    }
  };

  const submitEditTask = async (e) => {
    e.preventDefault();

    // 1. OPTIMISTIC UI: Instantly apply edits to screen
    setTasks(prev => prev.map(t => t._id === selectedTask._id ? { ...t, ...editForm } : t));
    setSelectedTask(prev => ({ ...prev, ...editForm }));
    setIsEditing(false);

    // 2. Background Database Sync
    try {
      await API.put(`/tasks/${selectedTask._id}`, editForm);
      taskCache.current = {};
      fetchTasks(true); // Silent sync
    } catch (error) {
      console.error('Failed to update task', error);
      fetchTasks(); // Revert on failure
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await API.post('/tasks', { title, description, dueDate, priority, status: 'Pending' });
      setTitle(''); setDescription(''); setDueDate(''); setPriority('Medium');
      taskCache.current = {}; 
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setEditForm({ title: task.title, description: task.description, dueDate: task.dueDate?.split('T')[0], priority: task.priority });
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in-up relative">
      
      {/* 1. DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="animate-popup bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100">
            <h3 className="text-2xl font-extrabold text-center text-slate-900 mb-2">Delete Task?</h3>
            <p className="text-center text-slate-500 mb-8 font-medium">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ isOpen: false, taskId: null })} className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={executeDelete} className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TASK DETAIL / EDIT MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="animate-popup bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-800">
                {isEditing ? 'Edit Task' : 'Task Details'}
              </h2>
              <button onClick={() => setSelectedTask(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm border border-slate-200 transition-all active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto">
              {!isEditing ? (
                // VIEW MODE
                <div className="space-y-6">
                  {/* Meta Badges */}
                  <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${selectedTask.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedTask.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      Status: {selectedTask.status}
                    </span>
                    <span className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${selectedTask.priority === 'High' ? 'bg-red-500' : selectedTask.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                      {selectedTask.priority} Priority
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-4">{selectedTask.title}</h3>
                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {selectedTask.description || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 text-sm font-medium text-slate-500">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Due Date</span>
                      {formatDate(selectedTask.dueDate)}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Created At</span>
                      {formatDate(selectedTask.createdAt, true)}
                    </div>
                  </div>
                </div>
              ) : (
                // EDIT MODE
                <form id="editForm" onSubmit={submitEditTask} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                    <input type="text" required value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                    <textarea required value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 min-h-[120px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Due Date</label>
                      <input type="date" required value={editForm.dueDate} onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
                      <select value={editForm.priority} onChange={(e) => setEditForm({...editForm, priority: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 justify-end items-center">
              {!isEditing ? (
                <>
                  <div className="flex-1">
                    <button onClick={() => confirmDelete(selectedTask._id)} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all">Delete</button>
                  </div>
                  <button onClick={() => handleUpdateStatus(selectedTask._id, selectedTask.status)} className="px-5 py-2.5 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-200 shadow-sm">
                    {selectedTask.status === 'Completed' ? 'Mark Pending' : 'Advance Status'}
                  </button>
                  <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all">
                    Edit Task
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all">Cancel</button>
                  <button type="submit" form="editForm" className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all">Save Changes</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          {/* Smooth Dashboard Avatar */}
          <div className="w-14 h-14 bg-white rounded-full p-1 shadow-sm shrink-0 border border-slate-100">
            <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xl font-bold overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 font-medium mt-0.5">Welcome back, {user?.name}</p>
          </div>
        </div>
        <div className="w-full sm:w-auto flex gap-3">
          <Link to="/profile" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm">
            Profile
          </Link>
          <button onClick={handleLogout} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-bold rounded-xl border-2 border-slate-200 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm">
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Create Form */}
        <div className="lg:col-span-4 h-fit bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/40 border border-slate-100 sticky top-8">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            New Task
          </h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Description</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Due Date</label>
                <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full mt-1 px-3 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full mt-1 px-3 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full mt-2 px-6 py-4 text-white font-bold bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md">
              Create Task
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Grid & Filters */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Filters */}
          <div className="bg-white/80 p-3 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3 sticky top-0 z-10 backdrop-blur-xl">
            <div className="relative w-full sm:flex-1">
              <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 px-3 py-2.5 bg-slate-50 border-none rounded-2xl font-medium text-slate-600">
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="flex-1 px-3 py-2.5 bg-slate-50 border-none rounded-2xl font-medium text-slate-600">
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* SIMPLIFIED CLICKABLE TASK GRID */}
          <div className={`grid grid-cols-1 gap-3 transition-opacity duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
            {tasks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                <p className="text-slate-600 font-bold">No tasks found</p>
              </div>
            ) : (
              tasks.map((task) => (
                <button 
                  key={task._id} 
                  onClick={() => openTaskModal(task)}
                  className={`w-full text-left bg-white p-5 rounded-2xl shadow-sm border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${task.status === 'Completed' ? 'border-emerald-100 bg-emerald-50/30 opacity-70 hover:opacity-100' : 'border-slate-200 hover:border-indigo-300'}`}>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-bold leading-tight truncate ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {truncateText(task.description, 50)}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${task.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {task.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Due: {formatDate(task.dueDate)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* 3. PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mt-6">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                Previous
              </button>
              <div className="text-sm font-bold text-slate-500">
                Page <span className="text-indigo-600">{page}</span> of {totalPages}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                Next
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;