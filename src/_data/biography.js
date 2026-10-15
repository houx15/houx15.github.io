import {milestones} from '../assets/biography.js';
export default [...milestones].sort((a,b)=>b.start-a.start || b.end-a.end);
