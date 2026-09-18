import { useState, useEffect } from "react";
import {
    Trash2,
    CircleCheck,
    Plus,
    Loader2,
    Archive,
    Save,
    Copy,
    Check,
} from "lucide-react";
import useConfirmDelete from "../../shared/useConfirmDelete";
import Field from "../../shared/field";
import RichTextEditor from "../../shared/richTextEditor";
import { uid, esc, inputCls } from "../../shared/utils";

interface GalleryImage {
    url: string;
    name?: string;
    alt?: string;
}

interface Post {
caption: string,
gallery: GalleryImage[],
}

export default function postBuilder() {
return (<div><p>work in progress</p></div>)
}