import { notFound } from "next/navigation";
import { getCurrentUser, toPublicUser } from "@/lib/session";
import { getPostView, listComments } from "@/lib/repo";
import { PostDetail } from "@/components/PostDetail";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const post = await getPostView(user, id);
  if (!post || !user) notFound();
  const comments = await listComments(user, id);

  return (
    <PostDetail
      post={post}
      comments={comments}
      me={toPublicUser(user)}
      isAdmin={user.role === "admin"}
    />
  );
}
