-- =========================================================================
-- ZOFTCORP BLOG SEED DATA
-- Import initial sample blog posts aligned with Zoftcorp website structure.
-- =========================================================================

-- Sample Posts (Draft and Published)
insert into public.posts (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  category,
  category_slug,
  tags,
  status,
  seo_title,
  seo_description,
  reading_time,
  featured,
  author_name,
  created_at,
  updated_at,
  published_at
) values
(
  'How ZoftCorp Ease Your Failover Cluster Installation with Slipstream',
  'how-zoftcorp-ease-your-failover-cluster-installation-with-slipstream',
  'Slipstream means embedded installation of SQL server with the available service packs, cumulative updates or Hotfixes. Learn how this technology saves DBA time and prevents clustering downtime.',
  '<h2>What is Slipstream?</h2><p>Slipstream means embedded installation of SQL server with the available service packs, cumulative updates or Hotfixes. This technology was introduced in SQL Server 2008 and it saves the time of DBA by reducing multiple restarts and maintenance windows during failover cluster setup.</p><h3>Why use Slipstream for Failover Clustering?</h3><ul><li>Reduces the installation footprint and setup duration.</li><li>Ensures all cluster nodes run the exact same binary patch level.</li><li>Avoids manual patching post-node addition.</li></ul><h3>Step-by-step Execution</h3><p>Follow our verified parameters when executing the slipstream command line setup:</p><pre><code>Setup.exe /Action=InstallFailoverCluster /UpdateEnabled=TRUE /UpdateSource="C:\SQLUpdates"</code></pre><p>Contact ZoftCorp Database Services for high-availability cluster architecture reviews and 24/7 SLA support.</p>',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  'Database Administration',
  'database-administration',
  array['Failover Cluster', 'Slipstream', 'SQL Server', 'High Availability'],
  'published',
  'How ZoftCorp Eases Failover Cluster Slipstream Installation | ZOFT Corp',
  'Learn how ZoftCorp eases Failover Cluster Slipstream Installation with step-by-step commands and procedures.',
  '3 min read',
  true,
  'ZoftCorp Engineering Team',
  now() - interval '14 days',
  now() - interval '2 days',
  now() - interval '14 days'
),
(
  'SQL Server – List all the database File Sizes and its free Spaces in an Instance',
  'sql-server-list-all-the-database-file-sizes-and-its-free-spaces-in-an-instance-t-sql-query-from-zoftcorp',
  'In this comprehensive guide, we provide a production-ready T-SQL query to list all database file sizes and their free spaces across an entire SQL Server instance.',
  '<h2>Monitoring Database Growth and Disk Capacity</h2><p>Proactive database administrators always track data and log file growth before storage volumes reach critical thresholds. This T-SQL script scans all online databases without causing locks or blocking user queries.</p><h3>The Instance-Wide Query</h3><pre><code>SELECT DB_NAME(database_id) AS DatabaseName,
  name AS LogicalFileName,
  type_desc AS FileType,
  size * 8 / 1024 AS SizeMB,
  physical_name AS PhysicalFilePath
FROM sys.master_files
ORDER BY size DESC;</code></pre><p>Regular monitoring prevents unexpected auto-growth pauses during peak business hours.</p>',
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
  'SQL Server',
  'sql-server',
  array['SQL Server', 'T-SQL', 'Storage', 'Monitoring'],
  'published',
  'SQL Server File Sizes and Free Space Query | ZOFT Corp',
  'Instance-wide T-SQL query to calculate file size and free space for SQL Server databases.',
  '4 min read',
  false,
  'ZoftCorp DBA Team',
  now() - interval '10 days',
  now() - interval '5 days',
  now() - interval '10 days'
),
(
  'Best Practices for Azure SQL Managed Instance Migration [Draft]',
  'best-practices-azure-sql-managed-instance-migration',
  'A strategic checklist for migrating enterprise on-premises SQL Server workloads to Azure SQL Managed Instance with near-zero downtime.',
  '<h2>Migration Assessment Phase</h2><p>Before initiating migration to Azure SQL MI, perform compatibility assessment using Azure Data Studio and Database Migration Assistant (DMA).</p><h3>Network Connectivity & VNet Peering</h3><p>Ensure that express route or Site-to-Site VPN is properly routed with minimal latency.</p>',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  'Azure / Cloud',
  'cloud-migrations',
  array['Azure', 'Cloud Migration', 'Managed Instance', 'Architecture'],
  'draft',
  'Azure SQL Managed Instance Migration Guide | ZOFT Corp',
  'Draft guide detailing migration checklists and best practices for Azure SQL MI.',
  '5 min read',
  false,
  'Cloud Architecture Lead',
  now() - interval '3 days',
  now() - interval '1 hour',
  null
)
on conflict (slug) do nothing;

-- =========================================================================
-- HOW TO AUTHORIZE AN ADMIN USER:
-- After creating a user in Supabase Authentication (Authentication -> Users -> Add User),
-- run the following SQL snippet using their generated User ID (UUID):
--
-- INSERT INTO public.admin_users (user_id, email, full_name, role)
-- VALUES (
--   '<USER_UUID_FROM_AUTH_USERS>',
--   'admin@zoftcorp.com',
--   'ZoftCorp Administrator',
--   'superadmin'
-- )
-- ON CONFLICT (user_id) DO NOTHING;
-- =========================================================================
