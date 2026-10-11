SELECT repository,links,1.0*links/SUM(links) OVER() share_of_repository_links FROM projects ORDER BY repository;
