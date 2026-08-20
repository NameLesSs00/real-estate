import { API_BASE_URL, API_DOMAIN } from './config';
import { getHeaders } from './common';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BlogSection {
  id: number;
  sectionNumber: number;
  tittle: string; // From backend schema typo
  content: string;
  imageUrl?: string;
}

export interface BlogItem {
  id: number;
  title: string;
  imageUrl?: string;
  sections: BlogSection[];
}

export interface PaginatedBlogs {
  items: BlogItem[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateBlogSectionPayload {
  sectionNumber: number;
  tittle: string;
  content: string;
}

export interface CreateBlogPayload {
  title: string;
  sections: CreateBlogSectionPayload[];
}

export interface UpdateBlogSectionPayload {
  id: number; // 0 means new section
  sectionNumber: number;
  tittle: string;
  content: string;
}

export interface UpdateBlogPayload {
  id: number;
  title: string;
  sections: UpdateBlogSectionPayload[];
}

export function getBlogImageUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  
  if (!cleanUrl.includes('images/blogs/')) {
    return `${API_DOMAIN}/images/blogs/${cleanUrl}`;
  }
  
  return `${API_DOMAIN}/${cleanUrl}`;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/** GET /api/Blogs — paginated list of all blogs */
export async function getBlogs(
  pageNumber = 1,
  pageSize = 100
): Promise<PaginatedBlogs> {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });
  const res = await fetch(`${API_BASE_URL}/api/Blogs?${params}`, {
    headers: { ...getHeaders(undefined, true) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch blogs.');
  const json = await res.json();
  return json.data ?? json;
}

/** GET /api/Blogs/{id} — get a single blog */
export async function getBlogById(id: number): Promise<BlogItem> {
  const res = await fetch(`${API_BASE_URL}/api/Blogs/${id}`, {
    headers: { ...getHeaders(undefined, true) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch blog details.');
  const json = await res.json();
  return json.data ?? json;
}

/** POST /api/Blogs — create a new blog (without images) */
export async function createBlog(payload: CreateBlogPayload): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/api/Blogs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create blog.');
  const json = await res.json();
  return json.data ?? json;
}

/** PUT /api/Blogs — update an existing blog (without images) */
export async function updateBlog(payload: UpdateBlogPayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/Blogs`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update blog.');
}

/** DELETE /api/Blogs/{id} — delete a blog */
export async function deleteBlog(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/Blogs/${id}`, {
    method: 'DELETE',
    headers: { ...getHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete blog.');
}

/** POST /api/Blogs/{id}/image — upload main image */
export async function uploadBlogImage(id: number, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const headers = getHeaders();
  // Browser will set Content-Type automatically with boundary for FormData
  delete headers['Content-Type'];

  const res = await fetch(`${API_BASE_URL}/api/Blogs/${id}/image`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Failed to upload blog image: ${res.status} ${errText}`);
  }
  
  const json = await res.json();
  if (json.success === false || json.succeeded === false) {
    const msg = json.message || 'Upload failed';
    throw new Error(msg);
  }
  return json.data ?? json;
}

/** DELETE /api/Blogs/{id}/image — delete main image */
export async function deleteBlogImage(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/Blogs/${id}/image`, {
    method: 'DELETE',
    headers: { ...getHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete blog image.');
}

/** POST /api/Blogs/{id}/sections/{sectionId}/image — upload section image */
export async function uploadSectionImage(id: number, sectionId: number, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const headers = getHeaders();
  delete headers['Content-Type'];

  const res = await fetch(`${API_BASE_URL}/api/Blogs/${id}/sections/${sectionId}/image`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Failed to upload section image: ${res.status} ${errText}`);
  }
  
  const json = await res.json();
  if (json.success === false || json.succeeded === false) {
    const msg = json.message || 'Upload failed';
    throw new Error(msg);
  }
  return json.data ?? json;
}

/** DELETE /api/Blogs/{id}/sections/{sectionId}/image — delete section image */
export async function deleteSectionImage(id: number, sectionId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/Blogs/${id}/sections/${sectionId}/image`, {
    method: 'DELETE',
    headers: { ...getHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete section image.');
}
