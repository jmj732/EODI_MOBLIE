import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { uploadImage } from "@/api/images";
import {
  type ItemFormPayload,
  createItem,
  deleteItem,
  getItemDetail,
  getPlaces,
  itemKeys,
  placeKeys,
  searchItems,
  updateItem,
} from "@/api/items";
import { FeedbackBanner, type FeedbackMessage } from "@/components/feedback-banner";
import { colors, radius, shadow, typography } from "@/theme";
import type { ItemCategory, ItemStatus, ItemSummary, Place } from "@/types/item";
import { confirmDestructive } from "@/utils/confirm";
import { normalizeImageUrl } from "@/utils/image";

const PAGE_SIZE = 30;

const CATEGORIES: ItemCategory[] = ["전자기기", "의류", "액세서리", "기타"];

const STATUS_OPTIONS: { label: string; value: ItemStatus | null }[] = [
  { label: "전체", value: null },
  { label: "보관중", value: "LOST" },
  { label: "폐기 예정", value: "TO_BE_DISCARDED" },
  { label: "지급 완료", value: "GIVEN" },
  { label: "폐기 완료", value: "DISCARDED" },
];

type FormState = {
  name: string;
  category: ItemCategory;
  foundAt: string;
  placeId: string;
  foundPlaceDetail: string;
  reporterName: string;
  reporterStudentCode: string;
  imageUrl: string;
};

const defaultForm: FormState = {
  name: "",
  category: "기타",
  foundAt: "",
  placeId: "",
  foundPlaceDetail: "",
  reporterName: "",
  reporterStudentCode: "",
  imageUrl: "",
};

export default function AdminManageScreen() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [status, setStatus] = useState<ItemStatus | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPlacePicker, setShowPlacePicker] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemSummary | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [formFeedback, setFormFeedback] = useState<FeedbackMessage | null>(null);

  const searchParams = useMemo(
    () => ({
      page: 1,
      size: PAGE_SIZE,
      sort: "LATEST" as const,
      query: activeQuery || undefined,
      status: status ? [status] : undefined,
    }),
    [activeQuery, status],
  );

  const items = useQuery({
    queryKey: itemKeys.search(searchParams),
    queryFn: () => searchItems(searchParams),
  });

  const places = useQuery({
    queryKey: placeKeys.all,
    queryFn: getPlaces,
  });

  const invalidateItems = (itemId?: number) => {
    void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    if (itemId) void queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
  };

  const create = useMutation({
    mutationFn: (payload: ItemFormPayload) => createItem(payload),
    onSuccess: () => {
      invalidateItems();
      closeModal();
      setFeedback({ tone: "success", title: "등록 완료", message: "분실물이 등록되었습니다." });
    },
    onError: () => setFormFeedback({ tone: "error", title: "등록 실패", message: "물품 등록에 실패했습니다." }),
  });

  const update = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: ItemFormPayload }) => updateItem(itemId, payload),
    onSuccess: (_, variables) => {
      invalidateItems(variables.itemId);
      closeModal();
      setFeedback({ tone: "success", title: "수정 완료", message: "분실물 정보가 수정되었습니다." });
    },
    onError: () => setFormFeedback({ tone: "error", title: "수정 실패", message: "물품 수정에 실패했습니다." }),
  });

  const remove = useMutation({
    mutationFn: deleteItem,
    onSuccess: (_, itemId) => {
      invalidateItems(itemId);
      setFeedback({ tone: "success", title: "삭제 완료", message: "분실물이 삭제되었습니다." });
    },
    onError: () => setFeedback({ tone: "error", title: "삭제 실패", message: "물품 삭제에 실패했습니다." }),
  });

  const imageUpload = useMutation({
    mutationFn: (asset: { uri: string; fileName?: string | null; mimeType?: string | null }) => {
      const type = asset.mimeType ?? "image/jpeg";
      return uploadImage(asset.uri, asset.fileName ?? `item-${Date.now()}.${extensionFromMime(type)}`, type);
    },
    onSuccess: ({ url }) => {
      setForm((current) => ({ ...current, imageUrl: url }));
      setFormFeedback({ tone: "success", title: "업로드 완료", message: "이미지 URL이 입력되었습니다." });
    },
    onError: () => setFormFeedback({ tone: "error", title: "업로드 실패", message: "이미지 업로드에 실패했습니다." }),
  });

  const selectedPlace = places.data?.find((place) => place.id.toString() === form.placeId);
  const total = items.data?.totalElements ?? 0;
  const isSaving = create.isPending || update.isPending;

  const openCreate = () => {
    setFeedback(null);
    setFormFeedback(null);
    setEditingItem(null);
    setForm(defaultForm);
    setModalVisible(true);
  };

  const openEdit = async (item: ItemSummary) => {
    setFeedback(null);
    setFormFeedback(null);
    try {
      const [detail, placeList] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: itemKeys.detail(item.id),
          queryFn: () => getItemDetail(item.id),
        }),
        queryClient.fetchQuery({
          queryKey: placeKeys.all,
          queryFn: getPlaces,
        }),
      ]);
      const matchedPlace = placeList.find((place) => place.name === detail.foundPlace);
      setEditingItem(detail);
      setForm({
        name: detail.name,
        category: detail.category,
        foundAt: detail.foundAt,
        placeId: detail.foundPlaceId ? String(detail.foundPlaceId) : matchedPlace ? String(matchedPlace.id) : "",
        foundPlaceDetail: detail.foundPlaceDetail ?? "",
        reporterName: detail.reporterName ?? "",
        reporterStudentCode: detail.reporterStudentCode?.toString() ?? "",
        imageUrl: detail.image ?? detail.imageUrl ?? "",
      });
      setModalVisible(true);
    } catch {
      setFeedback({ tone: "error", title: "수정 실패", message: "물품 상세 정보를 불러오지 못했습니다." });
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setForm(defaultForm);
    setFormFeedback(null);
  };

  const handleSubmit = () => {
    const result = buildPayload(form);
    if (!result.payload) {
      setFormFeedback({ tone: "warning", title: "입력 오류", message: result.error });
      return;
    }

    if (editingItem) {
      update.mutate({ itemId: editingItem.id, payload: result.payload });
    } else {
      create.mutate(result.payload);
    }
  };

  const handleDelete = (item: ItemSummary) => {
    confirmDestructive({
      title: "물품 삭제",
      message: `"${item.name}"을(를) 삭제할까요?`,
      confirmText: "삭제",
      onConfirm: () => remove.mutate(item.id),
    });
  };

  const uploadPickedImage = (asset: ImagePicker.ImagePickerAsset | undefined) => {
    if (!asset) return;

    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      setFormFeedback({ tone: "warning", title: "용량 초과", message: "이미지는 10MB 이하만 업로드할 수 있습니다." });
      return;
    }

    imageUpload.mutate({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    });
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormFeedback({ tone: "warning", title: "권한 필요", message: "분실물 사진을 등록하려면 사진 접근 권한이 필요합니다." });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;
    uploadPickedImage(result.assets[0]);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setFormFeedback({ tone: "warning", title: "권한 필요", message: "분실물 사진을 촬영하려면 카메라 권한이 필요합니다." });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;
    uploadPickedImage(result.assets[0]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBg }}>
      <FlatList
        data={items.data?.content ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={items.isRefetching} onRefresh={() => void items.refetch()} tintColor={colors.primary} />
        }
        ListHeaderComponent={
            <View style={{ gap: 14, marginBottom: 4 }}>
            <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={{ ...typography.h1, color: colors.textMain }}>분실물 관리</Text>
                <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSub }}>
                  등록된 물품을 검색하고 등록, 수정, 삭제합니다.
                </Text>
              </View>
              <Pressable
                onPress={openCreate}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" color="#FFFFFF" size={26} />
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: colors.cardBg,
                borderRadius: 14,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="search" color={colors.textMuted} size={19} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => setActiveQuery(query.trim())}
                placeholder="물품명 검색"
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                style={{ flex: 1, minHeight: 48, fontSize: 15, color: colors.textMain }}
              />
              <Pressable
                onPress={() => setActiveQuery(query.trim())}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "900", color: "#FFFFFF" }}>검색</Text>
              </Pressable>
            </View>

            <FlatList
              horizontal
              data={STATUS_OPTIONS}
              keyExtractor={(item) => item.label}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <FilterChip label={item.label} active={status === item.value} onPress={() => setStatus(item.value)} />
              )}
            />

            <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textSub }}>총 {total}개</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState loading={items.isLoading} error={items.isError} />}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            deleting={remove.isPending && remove.variables === item.id}
            onOpen={() => router.push(`/item/${item.id}`)}
            onEdit={() => openEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      <ItemFormModal
        visible={modalVisible}
        editing={!!editingItem}
        form={form}
        selectedPlace={selectedPlace}
        places={places.data ?? []}
        placesLoading={places.isLoading}
        placesError={places.isError}
        showPlacePicker={showPlacePicker}
        feedback={formFeedback}
        saving={isSaving}
        uploadingImage={imageUpload.isPending}
        onChange={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onPickImage={handlePickImage}
        onTakePhoto={handleTakePhoto}
        onOpenPlacePicker={() => setShowPlacePicker(true)}
        onClosePlacePicker={() => setShowPlacePicker(false)}
      />
    </View>
  );
}

function buildPayload(form: FormState): { payload: ItemFormPayload | null; error?: string } {
  if (!form.name.trim() || !form.foundAt.trim() || !form.placeId || !form.foundPlaceDetail.trim()) {
    return { payload: null, error: "물품명, 발견일, 장소, 세부 위치는 필수입니다." };
  }

  if (!/^\d{4}(-\d{2})?(-\d{2})?$/.test(form.foundAt.trim())) {
    return { payload: null, error: "발견일은 YYYY, YYYY-MM, YYYY-MM-DD 형식으로 입력해주세요." };
  }

  const placeId = Number(form.placeId);
  if (!Number.isInteger(placeId)) {
    return { payload: null, error: "장소를 다시 선택해주세요." };
  }

  const reporterStudentCode = form.reporterStudentCode.trim() ? Number(form.reporterStudentCode.trim()) : null;
  if (reporterStudentCode !== null && !Number.isInteger(reporterStudentCode)) {
    return { payload: null, error: "신고자 학번은 숫자로 입력해주세요." };
  }

  return {
    payload: {
      name: form.name.trim(),
      category: form.category,
      foundAt: form.foundAt.trim(),
      placeId,
      foundPlaceDetail: form.foundPlaceDetail.trim(),
      reporterName: form.reporterName.trim() || null,
      reporterStudentCode,
      imageUrl: form.imageUrl.trim() || null,
    },
  };
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: radius.chip,
        backgroundColor: active ? colors.primary : colors.cardBg,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "800", color: active ? "#FFFFFF" : colors.textSub }}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ loading, error }: { loading: boolean; error: boolean }) {
  if (loading) {
    return (
      <View style={{ alignItems: "center", paddingTop: 48 }}>
        <Text style={{ color: colors.textSub }}>물품 목록을 불러오는 중입니다.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        marginTop: 24,
        padding: 24,
        borderRadius: radius.card,
        backgroundColor: colors.cardBg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        gap: 8,
      }}
    >
      <Ionicons name={error ? "alert-circle-outline" : "file-tray-outline"} color={colors.textMuted} size={30} />
      <Text style={{ fontSize: 15, fontWeight: "900", color: colors.textMain }}>
        {error ? "목록을 불러오지 못했습니다" : "등록된 물품이 없습니다"}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSub, textAlign: "center" }}>
        {error ? "서버 연결과 권한을 확인해주세요." : "상단 + 버튼으로 분실물을 등록할 수 있습니다."}
      </Text>
    </View>
  );
}

function ItemRow({
  item,
  deleting,
  onOpen,
  onEdit,
  onDelete,
}: {
  item: ItemSummary;
  deleting: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const imageUrl = normalizeImageUrl(item.image);

  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: radius.card,
        padding: 15,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadow,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: 54, height: 54, borderRadius: 14 }} resizeMode="cover" />
        ) : (
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              backgroundColor: colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="cube-outline" color={colors.primary} size={22} />
          </View>
        )}
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textMain }} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSub }} numberOfLines={1}>
            {item.category} · {item.foundAt}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted }} numberOfLines={1}>
            {item.foundPlace ?? "장소 미상"}
            {item.foundPlaceDetail ? ` · ${item.foundPlaceDetail}` : ""}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
            {item.reporterName ? `신고자 ${item.reporterName}` : "신고자 미기재"}
            {item.reporterStudentCode ? ` (${item.reporterStudentCode})` : ""}
            {item.disposalDate ? ` · 폐기 예정 ${item.disposalDate}` : ""}
          </Text>
        </View>
        <StatusPill status={item.status} />
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <ActionButton title="상세" icon="open-outline" tone="neutral" onPress={onOpen} />
        <ActionButton title="수정" icon="create-outline" tone="neutral" onPress={onEdit} />
        <ActionButton title={deleting ? "삭제 중" : "삭제"} icon="trash-outline" tone="danger" onPress={onDelete} disabled={deleting} />
      </View>
    </View>
  );
}

function ActionButton({
  title,
  icon,
  tone,
  disabled,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: "neutral" | "danger";
  disabled?: boolean;
  onPress: () => void;
}) {
  const color = tone === "danger" ? colors.danger : colors.primary;
  const backgroundColor = tone === "danger" ? colors.dangerBg : colors.primaryBg;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 42,
        borderRadius: 11,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Ionicons name={icon} color={color} size={17} />
      <Text style={{ fontSize: 14, fontWeight: "900", color }}>{title}</Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: ItemStatus }) {
  const map = {
    LOST: { label: "보관중", color: colors.accent, backgroundColor: colors.accentBg },
    TO_BE_DISCARDED: { label: "폐기 예정", color: colors.warning, backgroundColor: colors.warningBg },
    GIVEN: { label: "지급 완료", color: colors.primary, backgroundColor: colors.primaryBg },
    DISCARDED: { label: "폐기 완료", color: colors.danger, backgroundColor: colors.dangerBg },
  } satisfies Record<ItemStatus, { label: string; color: string; backgroundColor: string }>;
  const option = map[status];

  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.chip, backgroundColor: option.backgroundColor }}>
      <Text style={{ fontSize: 11, fontWeight: "900", color: option.color }}>{option.label}</Text>
    </View>
  );
}

function ItemFormModal({
  visible,
  editing,
  form,
  selectedPlace,
  places,
  placesLoading,
  placesError,
  showPlacePicker,
  feedback,
  saving,
  uploadingImage,
  onChange,
  onClose,
  onSubmit,
  onPickImage,
  onTakePhoto,
  onOpenPlacePicker,
  onClosePlacePicker,
}: {
  visible: boolean;
  editing: boolean;
  form: FormState;
  selectedPlace?: Place;
  places: Place[];
  placesLoading: boolean;
  placesError: boolean;
  showPlacePicker: boolean;
  feedback: FeedbackMessage | null;
  saving: boolean;
  uploadingImage: boolean;
  onChange: (next: FormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  onPickImage: () => void;
  onTakePhoto: () => void;
  onOpenPlacePicker: () => void;
  onClosePlacePicker: () => void;
}) {
  const previewUrl = normalizeImageUrl(form.imageUrl);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" }}>
          <View
            style={{
              maxHeight: "88%",
              backgroundColor: colors.cardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 14 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center" }} />
              <Text style={{ fontSize: 20, fontWeight: "900", color: colors.textMain }}>{editing ? "물품 수정" : "물품 등록"}</Text>
              <FeedbackBanner feedback={feedback} />

              <FormInput label="물품명 *" value={form.name} onChangeText={(name) => onChange({ ...form, name })} />
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textMain }}>카테고리 *</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {CATEGORIES.map((category) => (
                    <FilterChip
                      key={category}
                      label={category}
                      active={form.category === category}
                      onPress={() => onChange({ ...form, category })}
                    />
                  ))}
                </View>
              </View>
              <FormInput label="발견일 *" placeholder="YYYY-MM-DD" value={form.foundAt} onChangeText={(foundAt) => onChange({ ...form, foundAt })} />
              <View style={{ gap: 7 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textMain }}>장소 *</Text>
                <Pressable
                  onPress={onOpenPlacePicker}
                  style={{
                    minHeight: 48,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 13,
                    justifyContent: "center",
                    backgroundColor: colors.appBg,
                  }}
                >
                  <Text style={{ fontSize: 15, color: selectedPlace ? colors.textMain : colors.textMuted }}>
                    {selectedPlace ? selectedPlace.name : "장소 선택"}
                  </Text>
                </Pressable>
              </View>
              <FormInput label="세부 위치 *" value={form.foundPlaceDetail} onChangeText={(foundPlaceDetail) => onChange({ ...form, foundPlaceDetail })} />
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textMain }}>이미지</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <ImageSourceButton
                    title={uploadingImage ? "업로드 중" : "앨범"}
                    icon="image-outline"
                    disabled={uploadingImage}
                    onPress={onPickImage}
                  />
                  <ImageSourceButton
                    title="카메라"
                    icon="camera-outline"
                    disabled={uploadingImage}
                    onPress={onTakePhoto}
                  />
                </View>
                {previewUrl ? (
                  <Image
                    source={{ uri: previewUrl }}
                    style={{ width: "100%", height: 150, borderRadius: 12, backgroundColor: colors.appBg }}
                    resizeMode="cover"
                  />
                ) : null}
                <TextInput
                  value={form.imageUrl}
                  onChangeText={(imageUrl) => onChange({ ...form, imageUrl })}
                  placeholder="이미지 URL 또는 사진 선택"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  style={{
                    minHeight: 48,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 13,
                    fontSize: 15,
                    color: colors.textMain,
                    backgroundColor: colors.appBg,
                  }}
                />
              </View>
              <FormInput label="신고자 이름" value={form.reporterName} onChangeText={(reporterName) => onChange({ ...form, reporterName })} />
              <FormInput
                label="신고자 학번"
                value={form.reporterStudentCode}
                keyboardType="numeric"
                onChangeText={(reporterStudentCode) => onChange({ ...form, reporterStudentCode })}
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                <ActionFooterButton title="취소" tone="neutral" onPress={onClose} />
                <ActionFooterButton title={editing ? "수정" : "등록"} tone="primary" onPress={onSubmit} disabled={saving} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showPlacePicker} transparent animationType="slide" onRequestClose={onClosePlacePicker}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" }}>
          <View
            style={{
              maxHeight: "54%",
              backgroundColor: colors.cardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: colors.textMain }}>장소 선택</Text>
              {placesLoading ? <Text style={{ color: colors.textSub }}>장소를 불러오는 중입니다.</Text> : null}
              {placesError ? <Text style={{ color: colors.danger }}>장소를 불러오지 못했습니다.</Text> : null}
              {!placesLoading && !placesError && places.length === 0 ? <Text style={{ color: colors.textSub }}>등록된 장소가 없습니다.</Text> : null}
              {places.map((place) => {
                const active = form.placeId === String(place.id);
                return (
                  <Pressable
                    key={place.id}
                    onPress={() => {
                      onChange({ ...form, placeId: String(place.id) });
                      onClosePlacePicker();
                    }}
                    style={{
                      padding: 15,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primaryBg : colors.appBg,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: active ? "900" : "700", color: colors.textMain }}>{place.name}</Text>
                  </Pressable>
                );
              })}
              <ActionFooterButton title="닫기" tone="neutral" onPress={onClosePlacePicker} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function extensionFromMime(type: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[type] ?? "jpg";
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ fontSize: 13, fontWeight: "800", color: colors.textMain }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        style={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 13,
          fontSize: 15,
          color: colors.textMain,
          backgroundColor: colors.appBg,
        }}
      />
    </View>
  );
}

function ImageSourceButton({
  title,
  icon,
  disabled,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 42,
        borderRadius: 11,
        backgroundColor: disabled ? "#E5E7EB" : colors.primaryBg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <Ionicons name={icon} color={disabled ? colors.textMuted : colors.primary} size={17} />
      <Text style={{ fontSize: 13, fontWeight: "900", color: disabled ? colors.textMuted : colors.primary }}>{title}</Text>
    </Pressable>
  );
}

function ActionFooterButton({
  title,
  tone,
  disabled,
  onPress,
}: {
  title: string;
  tone: "primary" | "neutral";
  disabled?: boolean;
  onPress: () => void;
}) {
  const active = tone === "primary";
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: radius.button,
        backgroundColor: disabled ? "#E5E7EB" : active ? colors.primary : "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "900", color: disabled ? colors.textMuted : active ? "#FFFFFF" : colors.textMain }}>
        {disabled ? "처리 중" : title}
      </Text>
    </Pressable>
  );
}
