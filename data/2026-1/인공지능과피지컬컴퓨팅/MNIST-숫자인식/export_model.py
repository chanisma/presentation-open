# %%
# 🚀 MNIST 모델 학습 및 TensorFlow.js 내보내기
# Google Colab에서 실행하세요!
# 생성된 model 폴더를 프레젠테이션 폴더에 복사하면 됩니다.

# %%
# 필요한 라이브러리 설치
!pip install tensorflowjs -q

# %%
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import tensorflowjs as tfjs
import numpy as np

# MNIST 데이터 로드
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
x_train = x_train.astype('float32') / 255.0
x_test = x_test.astype('float32') / 255.0
x_train = x_train.reshape(-1, 28, 28, 1)
x_test = x_test.reshape(-1, 28, 28, 1)

# %%
# 데이터 증강 - 손글씨 입력의 다양한 변형에 강건한 모델을 만들기 위함
data_augmentation = keras.Sequential([
    layers.RandomRotation(0.08),       # ±약 14도 회전
    layers.RandomTranslation(0.08, 0.08),  # ±8% 이동
    layers.RandomZoom((-0.1, 0.1)),    # ±10% 확대/축소
])

# %%
# CNN 모델 구성 (5x5 커널 + 큰 Dense → 손글씨 인식에 최적화)
model = keras.Sequential([
    layers.Input(shape=(28, 28, 1)),
    # 첫 번째 Conv 블록: 5x5 커널로 넓은 수용 영역
    layers.Conv2D(32, (5, 5), activation='relu', padding='same'),
    layers.MaxPooling2D((2, 2)),
    # 두 번째 Conv 블록
    layers.Conv2D(64, (5, 5), activation='relu', padding='same'),
    layers.MaxPooling2D((2, 2)),
    # 분류기
    layers.Flatten(),
    layers.Dropout(0.5),
    layers.Dense(1024, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(10, activation='softmax'),
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# %%
# 데이터 증강을 적용한 학습 (15 에포크)
# 증강은 학습 데이터에만 적용합니다

# 데이터셋 파이프라인 구성
batch_size = 128
train_ds = tf.data.Dataset.from_tensor_slices((x_train, y_train))
train_ds = train_ds.shuffle(60000).batch(batch_size)

# 증강 적용 학습 루프 대신 fit에서 직접 처리
# (data_augmentation을 모델에 포함하면 추론 시에도 적용되므로, 별도로 처리)
augmented_train = train_ds.map(
    lambda x, y: (data_augmentation(x, training=True), y),
    num_parallel_calls=tf.data.AUTOTUNE
).prefetch(tf.data.AUTOTUNE)

val_ds = tf.data.Dataset.from_tensor_slices(
    (x_train[-6000:], y_train[-6000:])
).batch(batch_size)

history = model.fit(
    augmented_train,
    epochs=15,
    validation_data=val_ds,
    verbose=1
)

# 테스트 정확도 확인
test_loss, test_acc = model.evaluate(x_test, y_test, verbose=0)
print(f'\n✅ 테스트 정확도: {test_acc*100:.2f}%')

# %%
# TensorFlow.js 형식으로 내보내기
import os
export_dir = './tfjs_model'
os.makedirs(export_dir, exist_ok=True)

tfjs.converters.save_keras_model(model, export_dir)

print(f'\n📁 모델이 {export_dir}에 저장되었습니다!')
print('파일 목록:')
for f in os.listdir(export_dir):
    size = os.path.getsize(os.path.join(export_dir, f))
    print(f'  {f} ({size:,} bytes)')

# %%
# Colab에서 다운로드 (model 폴더를 zip으로 압축)
import shutil
shutil.make_archive('mnist_model', 'zip', '.', 'tfjs_model')

from google.colab import files
files.download('mnist_model.zip')

print('\n📥 다운로드된 zip 파일을 풀어서')
print('   MNIST-숫자인식/model/ 폴더에 넣어주세요.')
print('   필요한 파일: model.json, group1-shard1of1.bin')
